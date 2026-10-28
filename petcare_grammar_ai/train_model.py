"""
PetCare Grammar AI - T5 Model Fine-Tuning Script
Base Model: vennify/t5-base-grammar-correction
Framework : Hugging Face Transformers (Seq2SeqTrainer)

Usage:
    python train_model.py
    python train_model.py --epochs 3 --batch-size 4 --lr 3e-5
"""

import os
import sys
import argparse
import logging

# Suppress verbose backend logs & configure torch
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import pandas as pd
import torch
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    DataCollatorForSeq2Seq,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("TrainPetCareGrammar")

DEFAULT_DATA_PATH = os.path.join(os.path.dirname(__file__), "training_data.csv")
DEFAULT_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "petcare_grammar_model")
DEFAULT_MODEL_NAME = DEFAULT_OUTPUT_DIR if os.path.exists(os.path.join(DEFAULT_OUTPUT_DIR, "config.json")) else "vennify/t5-base-grammar-correction"
INPUT_PREFIX = "grammar: "


def load_dataset(csv_path: str):
    """Load and format all CSV training datasets in petcare_grammar_ai into a Hugging Face Dataset."""
    dir_path = os.path.dirname(os.path.abspath(csv_path))
    csv_files = []
    abs_csv = os.path.abspath(csv_path)
    if os.path.exists(abs_csv):
        csv_files.append(abs_csv)
    
    # Also find any other CSV datasets in the directory
    for f in os.listdir(dir_path):
        if f.endswith(".csv"):
            full_p = os.path.abspath(os.path.join(dir_path, f))
            if full_p not in csv_files:
                csv_files.append(full_p)

    dfs = []
    for p in csv_files:
        try:
            d = pd.read_csv(p)
            col_map = {}
            for col in d.columns:
                c = col.lower().strip()
                if c in ["input", "input_text", "incorrect", "wrong", "source"]:
                    col_map[col] = "input_text"
                elif c in ["target", "target_text", "correct", "corrected", "label"]:
                    col_map[col] = "target_text"
            d = d.rename(columns=col_map)
            if "input_text" in d.columns and "target_text" in d.columns:
                d = d.dropna(subset=["input_text", "target_text"]).copy()
                logger.info(f"Loaded {len(d)} pairs from {os.path.basename(p)}")
                dfs.append(d[["input_text", "target_text"]])
        except Exception as e:
            logger.warning(f"Could not load {p}: {e}")

    if not dfs:
        raise ValueError(f"No valid CSV datasets found in {dir_path}")

    df = pd.concat(dfs, ignore_index=True)
    df["input_text"] = df["input_text"].astype(str).str.strip()
    df["target_text"] = df["target_text"].astype(str).str.strip()
    # Deduplicate while preserving order
    df = df.drop_duplicates(subset=["input_text"]).copy()
    logger.info(f"Total unified unique training pairs across all datasets: {len(df)}")

    # Drop nulls and strip whitespace
    df = df.dropna(subset=["input_text", "target_text"]).copy()
    df["input_text"] = df["input_text"].astype(str).str.strip()
    df["target_text"] = df["target_text"].astype(str).str.strip()

    # Prepend T5 task prefix 'grammar: ' if not already included
    df["input_text"] = df["input_text"].apply(
        lambda x: x if x.startswith(INPUT_PREFIX) else f"{INPUT_PREFIX}{x}"
    )

    hf_dataset = Dataset.from_pandas(df[["input_text", "target_text"]])
    # Split into 85% train and 15% validation
    split_dataset = hf_dataset.train_test_split(test_size=0.15, seed=42)
    return split_dataset


def preprocess_function(examples, tokenizer, max_input_length=128, max_target_length=128):
    """Tokenize inputs with T5 prefix and target outputs."""
    inputs = examples["input_text"]
    targets = examples["target_text"]

    model_inputs = tokenizer(
        inputs,
        max_length=max_input_length,
        padding=False,
        truncation=True
    )

    labels = tokenizer(
        text_target=targets,
        max_length=max_target_length,
        padding=False,
        truncation=True
    )

    model_inputs["labels"] = labels["input_ids"]
    return model_inputs


def train(args):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    if device == "cpu":
        cores = os.cpu_count() or 4
        torch.set_num_threads(cores)
        logger.info(f"Target compute device: CPU (utilizing {cores} threads)")
    else:
        logger.info(f"Target compute device: {device.upper()}")

    # 1. Load Tokenizer & Model
    logger.info(f"Loading base model and tokenizer: {args.model_name}")
    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(args.model_name)
    model.config.use_cache = False
    for param in model.encoder.parameters():
        param.requires_grad = False
    trainable_cnt = sum(p.numel() for p in model.parameters() if p.requires_grad)
    logger.info(f"Frozen encoder. Trainable parameters: {trainable_cnt:,} (efficient CPU training)")
    model.to(device)

    # 2. Prepare Dataset
    dataset = load_dataset(args.data_path)
    tokenized_dataset = dataset.map(
        lambda x: preprocess_function(x, tokenizer, args.max_length, args.max_length),
        batched=True,
        remove_columns=dataset["train"].column_names
    )
    logger.info(f"Training samples: {len(tokenized_dataset['train'])}, Validation samples: {len(tokenized_dataset['test'])}")

    # 3. Data Collator for dynamic padding
    data_collator = DataCollatorForSeq2Seq(
        tokenizer=tokenizer,
        model=model,
        padding=True,
        label_pad_token_id=-100
    )

    # 4. Training Arguments
    import tempfile
    temp_train_dir = tempfile.mkdtemp(prefix="petcare_train_")
    os.makedirs(args.output_dir, exist_ok=True)

    training_kwargs = {
        "output_dir": temp_train_dir,
        "optim": "adafactor",
        "save_strategy": "no",
        "learning_rate": args.lr,
        "per_device_train_batch_size": args.batch_size,
        "per_device_eval_batch_size": args.batch_size,
        "gradient_accumulation_steps": args.gradient_accumulation_steps,
        "num_train_epochs": args.epochs,
        "weight_decay": 0.01,
        "predict_with_generate": False,
        "logging_steps": 10,
        "fp16": False,
        "report_to": "none"
    }
    try:
        training_args = Seq2SeqTrainingArguments(eval_strategy="no", **training_kwargs)
    except TypeError:
        training_args = Seq2SeqTrainingArguments(evaluation_strategy="no", **training_kwargs)

    # 5. Trainer
    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset["train"],
        eval_dataset=tokenized_dataset["test"],
        tokenizer=tokenizer,
        data_collator=data_collator
    )

    # 6. Run Fine-Tuning
    logger.info("Starting fine-tuning...")
    train_result = trainer.train()
    logger.info(f"Training completed. Global steps: {train_result.global_step}, Training loss: {train_result.training_loss:.4f}")

    # Evaluate final validation metrics
    logger.info("Running validation evaluation...")
    eval_metrics = trainer.evaluate()
    logger.info(f"Evaluation metrics: {eval_metrics}")

    # 7. Save Final Model & Tokenizer (using staging dir to avoid Windows mmap overwrite locks)
    logger.info(f"Saving fine-tuned model and tokenizer to: {args.output_dir}")
    staging_save_dir = tempfile.mkdtemp(prefix="petcare_save_")
    model.save_pretrained(staging_save_dir, safe_serialization=True)
    tokenizer.save_pretrained(staging_save_dir)

    # Release model memory mapping on Windows
    del model
    del tokenizer
    del trainer
    import gc
    import shutil
    gc.collect()

    os.makedirs(args.output_dir, exist_ok=True)
    try:
        for fname in os.listdir(staging_save_dir):
            src_f = os.path.join(staging_save_dir, fname)
            dst_f = os.path.join(args.output_dir, fname)
            if os.path.isfile(src_f):
                shutil.copy2(src_f, dst_f)
            elif os.path.isdir(src_f):
                shutil.copytree(src_f, dst_f, dirs_exist_ok=True)
        shutil.rmtree(staging_save_dir, ignore_errors=True)
    except Exception as copy_err:
        logger.warning(f"Direct file copy locked by OS ({copy_err}). Scheduling detached update...")
        import subprocess
        cmd = f'powershell -Command "Start-Sleep -Seconds 2; Copy-Item -Path \'{staging_save_dir}\\*\' -Destination \'{args.output_dir}\' -Recurse -Force; Remove-Item -Path \'{staging_save_dir}\' -Recurse -Force"'
        subprocess.Popen(cmd, shell=True)

    try:
        shutil.rmtree(temp_train_dir, ignore_errors=True)
    except Exception:
        pass

    # Save a metadata file
    meta_info = {
        "base_model": args.model_name,
        "task": "petcare_grammar_correction",
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "learning_rate": args.lr,
        "final_train_loss": round(float(train_result.training_loss), 4) if hasattr(train_result, "training_loss") else None,
        "eval_metrics": {k: float(v) for k, v in eval_metrics.items() if isinstance(v, (int, float))}
    }
    with open(os.path.join(args.output_dir, "petcare_meta.json"), "w", encoding="utf-8") as f:
        import json
        json.dump(meta_info, f, indent=2)

    logger.info("Training completed successfully! Model is ready for deployment.")


def main():
    parser = argparse.ArgumentParser(description="Fine-tune T5 for PetCare Clinical Grammar Correction")
    parser.add_argument("--model-name", type=str, default=DEFAULT_MODEL_NAME, help="Hugging Face base model ID")
    parser.add_argument("--data-path", type=str, default=DEFAULT_DATA_PATH, help="Path to training CSV file")
    parser.add_argument("--output-dir", type=str, default=DEFAULT_OUTPUT_DIR, help="Directory to save fine-tuned model")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=2, help="Batch size per device")
    parser.add_argument("--gradient-accumulation-steps", type=int, default=2, help="Gradient accumulation steps")
    parser.add_argument("--lr", type=float, default=5e-5, help="Learning rate")
    parser.add_argument("--max-length", type=int, default=128, help="Max sequence token length")
    args = parser.parse_args()

    train(args)


if __name__ == "__main__":
    main()

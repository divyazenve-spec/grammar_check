"""
PetCare Grammar AI - Model Testing & Evaluation Script
Tests the fine-tuned model saved in 'petcare_grammar_model/' (or falls back to the active service / base model).

Usage:
    # Run test suite:
    python test_model.py

    # Test custom sentence:
    python test_model.py --text "The cat not sleeping."
    python test_model.py --text "This sentences has has bads grammar."
"""

import os
import sys
import argparse
import json
import urllib.request

# Suppress verbose backend logs & configure torch
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

MODEL_DIR = os.path.join(os.path.dirname(__file__), "petcare_grammar_model")
BASE_MODEL = "vennify/t5-base-grammar-correction"
PREFIX = "grammar: "

# Default petcare evaluation test suite
SAMPLE_TESTS = [
    "The cat not sleeping.",
    "The cat vomit.",
    "The dog not eating from 2 days.",
    "Puppy have high fever and shivering.",
    "This sentences has has bads grammar.",
    "Dog leg bleeding after accident.",
    "My dod got diaria.",
    "My hosre got colik.",
    "My brid got egg bind.",
    "My cow got mastitis and not chewing cud.",
    "My claf got diaria from 2 days.",
    "My dog's name is Juju. It has not been drinking water for 3 days. And more tired."
]


class GrammarTester:
    def __init__(self, model_path: str, num_beams: int = 5):
        self.model_path = model_path
        self.num_beams = num_beams
        self.engine = None
        self.api_url = None
        self.happy_tt = None
        self.tt_args = None
        self.tokenizer = None
        self.model = None
        self.device = "cpu"
        self._init_engine()

    def _init_engine(self):
        # 1. If local microservice is already serving the model, connect to save memory
        try:
            req = urllib.request.Request("http://127.0.0.1:5001/health")
            with urllib.request.urlopen(req, timeout=1) as resp:
                if resp.status == 200:
                    self.api_url = "http://127.0.0.1:5001/correct"
                    self.engine = "microservice_api"
                    print("[*] Connected to active local AI model service on http://127.0.0.1:5001")
                    return
        except Exception:
            pass

        # 2. Prefer HappyTransformer
        try:
            from happytransformer import HappyTextToText, TTSettings
            print(f"[*] Initializing HappyTextToText with: '{self.model_path}'...")
            self.happy_tt = HappyTextToText("T5", self.model_path)
            self.tt_args = TTSettings(num_beams=self.num_beams, min_length=1)
            self.engine = "happytransformer"
            print("[*] Successfully loaded via HappyTransformer!")
            return
        except Exception as e:
            print(f"[Notice] HappyTransformer initialization: {e}. Trying standard transformers...")

        # 3. Fallback to standard transformers
        import torch
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_path)
        self.model.eval()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        self.engine = "transformers"
        print(f"[*] Loaded via Transformers on {self.device.upper()}!")

    def correct(self, text: str) -> str:
        clean_text = text.strip()

        # Route to active microservice if connected
        if self.engine == "microservice_api":
            try:
                payload = json.dumps({"text": clean_text}).encode("utf-8")
                req = urllib.request.Request(
                    self.api_url,
                    data=payload,
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    return res_data.get("corrected", clean_text)
            except Exception as e:
                print(f"[API Error] {e}")

        prompt = clean_text if clean_text.startswith(PREFIX) else f"{PREFIX}{clean_text}"

        if self.engine == "happytransformer" and self.happy_tt:
            res = self.happy_tt.generate_text(prompt, args=self.tt_args)
            return res.text.strip() if res and hasattr(res, 'text') else clean_text

        if self.tokenizer and self.model:
            import torch
            inputs = self.tokenizer(prompt, return_tensors="pt", max_length=128, truncation=True).to(self.device)
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_length=128,
                    num_beams=self.num_beams,
                    min_length=1,
                    early_stopping=True
                )
            return self.tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        return clean_text


def main():
    parser = argparse.ArgumentParser(description="Test PetCare T5 Grammar Model")
    parser.add_argument("--model-path", type=str, default=None, help="Path to model directory")
    parser.add_argument("--text", type=str, default=None, help="Custom sentence to correct")
    parser.add_argument("--num-beams", type=int, default=5, help="Number of beams for generation (default: 5)")
    args = parser.parse_args()

    # Determine target model path
    if args.model_path:
        target_path = args.model_path
    elif os.path.exists(os.path.join(MODEL_DIR, "config.json")) or os.path.exists(os.path.join(MODEL_DIR, "model.safetensors")):
        target_path = MODEL_DIR
        print(f"[Notice] Using fine-tuned model from '{MODEL_DIR}'")
    else:
        target_path = BASE_MODEL
        print(f"[Notice] Fine-tuned model checkpoint not detected in '{MODEL_DIR}'. Testing with base model '{BASE_MODEL}'")

    tester = GrammarTester(target_path, num_beams=args.num_beams)

    print("\n" + "=" * 70)
    print("PetCare AI Grammar Assistant - Evaluation Run")
    print("=" * 70)

    if args.text:
        corrected = tester.correct(args.text)
        print(f"Input     : {args.text}")
        print(f"Corrected : {corrected}")
        print("=" * 70)
        return

    # Run default test suite
    print(f"Running test suite ({len(SAMPLE_TESTS)} samples):\n")
    for i, sample in enumerate(SAMPLE_TESTS, 1):
        corrected = tester.correct(sample)
        print(f"[{i:02d}] Input     : {sample}")
        print(f"     Corrected : {corrected}\n")

    print("=" * 70)
    print("Evaluation completed successfully.")


if __name__ == "__main__":
    main()

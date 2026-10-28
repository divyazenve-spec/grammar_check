import csv
import json
import os
import re

csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "training_data.csv"))
js_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client", "src", "services", "trainingDataMap.js"))

t_map = {}
with open(csv_path, "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    next(reader, None)
    for r in reader:
        if len(r) >= 2 and r[0].strip() and r[1].strip():
            k = re.sub(r"[.!?,;:]+$", "", r[0].lower().strip())
            k = re.sub(r"\s+", " ", k)
            v = r[1].strip()
            t_map[k] = v
            if k.startswith("the "):
                t_map[k[4:]] = v

with open(js_path, "w", encoding="utf-8") as f:
    f.write("// Generated from petcare_grammar_ai unified dataset\n")
    f.write("export const TRAINING_DATASET_MAP = {\n")
    items = list(t_map.items())
    for i, (k, v) in enumerate(items):
        comma = "," if i < len(items) - 1 else ""
        f.write(f"  {json.dumps(k)}: {json.dumps(v)}{comma}\n")
    f.write("};\n")

print(f"Successfully exported {len(t_map)} pairs to {js_path}!")

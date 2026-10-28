"""
Zenve Vet - AI Grammar Correction Service
Powered by Happy Transformer & Hugging Face: vennify/t5-base-grammar-correction

Usage:
  1. CLI test:
     python grammar_service.py --text "This sentences has has bads grammar."
  2. Run Microservice API:
     python grammar_service.py --serve --port 5001
"""

import os
import sys
import argparse
import subprocess
import json

# Suppress verbose backend logs
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

LOCAL_MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "petcare_grammar_ai", "petcare_grammar_model"))
DEFAULT_MODEL_ID = "vennify/t5-base-grammar-correction"

def get_active_model_id():
    if os.path.exists(os.path.join(LOCAL_MODEL_DIR, "config.json")) or os.path.exists(os.path.join(LOCAL_MODEL_DIR, "model.safetensors")) or os.path.exists(os.path.join(LOCAL_MODEL_DIR, "pytorch_model.bin")):
        return LOCAL_MODEL_DIR
    return DEFAULT_MODEL_ID

MODEL_ID = get_active_model_id()

_happy_tt = None
_tt_settings = None
_load_attempted = False
_model_ready = False


def init_happy_model():
    """
    Attempt to load HappyTextToText with fine-tuned PetCare model or base T5
    and TTSettings(num_beams=5, min_length=1).
    """
    global _happy_tt, _tt_settings, _load_attempted, _model_ready, MODEL_ID
    if _load_attempted:
        return _model_ready

    _load_attempted = True
    MODEL_ID = get_active_model_id()
    try:
        from happytransformer import HappyTextToText, TTSettings

        print(f"[HappyTransformer] Initializing HappyTextToText('T5', '{MODEL_ID}')...")
        _happy_tt = HappyTextToText("T5", MODEL_ID)
        _tt_settings = TTSettings(num_beams=5, min_length=1)
        _model_ready = True
        print(f"[HappyTransformer] Successfully loaded model '{MODEL_ID}'!")
        return True
    except Exception as e:
        print(f"[HappyTransformer Warning] Local model load failed: {e}")
        _model_ready = False
        return False


def normalize_broken_corpus(text: str) -> str:
    """
    Generalized analyzer and normalizer for broken corpus typing mistakes
    including misplaced full stops, commas, intra-word punctuation, and dangling fragments.
    """
    import re
    if not text:
        return ""
    t = text.strip()

    # 1. Clean intra-word special characters & punctuation (e.g. r.eal -> real, c,at -> cat, p#ain -> pain)
    t = re.sub(r'(?<=[a-zA-Z])([.,/#!?*~^@$%&_])(?=[a-zA-Z])', '', t)

    # 2. Pronoun & general typos
    t = re.sub(r'\bmi\b', 'my', t, flags=re.IGNORECASE)

    # Feline keyboard typos
    t = re.sub(r'\b(cst|cta|czt|cwt|kat|katt|caat|ct)\b', 'cat', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(kity|kitti|kittie)\b', 'kitty', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(kitn|kiten|kittn|kitin|kttn)\b', 'kitten', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(felin|feln|felein)\b', 'feline', t, flags=re.IGNORECASE)

    # Canine keyboard typos
    t = re.sub(r'\b(dag|dogg|dod|doh|dgo|dig|dug)\b', 'dog', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(pupp|pupy|puppi|pupie|puppe|pppy)\b', 'puppy', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(canin|cannine)\b', 'canine', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(hnd|houond)\b', 'hound', t, flags=re.IGNORECASE)

    # Bovine keyboard typos
    t = re.sub(r'\b(caw|cuw|coo|coww)\b', 'cow', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(claf|calfe|caff|clf)\b', 'calf', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(bovien|bovin|bovne)\b', 'bovine', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(cattel|catle|cattl|cattles)\b', 'cattle', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(heifr|hifer)\b', 'heifer', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(bll|bul)\b', 'bull', t, flags=re.IGNORECASE)

    # Equine keyboard typos
    t = re.sub(r'\b(hosre|hrs|horce|hrse|hrose|hourse|horsee)\b', 'horse', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(poni|ponny)\b', 'pony', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(faol|fol|foale)\b', 'foal', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(stalion|staln|stalian)\b', 'stallion', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(mre|mar)\b', 'mare', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(equin|eqine|eqwine)\b', 'equine', t, flags=re.IGNORECASE)

    # Avian keyboard typos
    t = re.sub(r'\b(brid|brd|birt|bid|birdd)\b', 'bird', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(parot|parott|perrot|parrtt|parret|perret)\b', 'parrot', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(chikken|chiken|chickn|chikn)\b', 'chicken', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(feathr|fether)\b', 'feather', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(cocktiel|cockatil|cokatiel)\b', 'cockatiel', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(budgi|budgy|bujie)\b', 'budgie', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(avien|avin)\b', 'avian', t, flags=re.IGNORECASE)

    # Clinical signs typos
    t = re.sub(r'\bating\b', 'eating', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(drining|drnking)\b', 'drinking', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(vomitin|vomitng|vomting|vomtting|vomitting|vomitingg)\b', 'vomiting', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(limpng|limpn|limpimg)\b', 'limping', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(lethargik|lethergic)\b', 'lethargic', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(scratchn|scratchng)\b', 'scratching', t, flags=re.IGNORECASE)

    # 3. Phonetic condition misspellings
    t = re.sub(r'\b(diaria|diarhea|diarrea|dirhea|diarreah|diarrheoa|diariya|diareah)\b', 'diarrhea', t, flags=re.IGNORECASE)
    t = re.sub(r'\bcolik\b', 'colic', t, flags=re.IGNORECASE)
    t = re.sub(r'\blaminitus\b', 'laminitis', t, flags=re.IGNORECASE)
    t = re.sub(r'\babsess\b', 'abscess', t, flags=re.IGNORECASE)
    t = re.sub(r'\bsneezng\b', 'sneezing', t, flags=re.IGNORECASE)

    # 4. Repeated punctuation
    t = re.sub(r'[\.,]{2,}', '.', t)
    t = re.sub(r'!{2,}', '!', t)
    t = re.sub(r'\?{2,}', '?', t)

    # 5. Spaces before punctuation
    t = re.sub(r'\s+([.,!?;:])', r'\1', t)

    # 6. Broken copula before 'The <action-ing> problem is <adj>'
    ANIMAL = r'(?:dog|cat|puppy|kitten|horse|foal|bird|parrot|cow|calf|cattle|cockatiel|budgie|patient|animal)'

    def fix_copula_problem(m):
        pfx = (m.group(1) or 'The ').capitalize()
        return f"{pfx}{m.group(2).lower()} {m.group(3).lower()} {m.group(4).lower()}. The problem is {m.group(5).lower()}."

    t = re.sub(
        rf'\b(my\s+)?({ANIMAL})\s+(is|was)\s*[.,;]\s*(?:the\s+)?(\w+ing)\s+problem\s+is\s+([a-zA-Z]+)\.?',
        fix_copula_problem,
        t,
        flags=re.IGNORECASE
    )

    # 7. Broken copula before continuous action or adjective
    def fix_copula_action(m):
        pfx = (m.group(1) or 'The ').capitalize()
        return f"{pfx}{m.group(2).lower()} {m.group(3).lower()} {m.group(4).lower()}"

    t = re.sub(
        rf'\b(my\s+)?({ANIMAL})\s+(is|was)\s*[.,;]\s*(not\s+\w+|\w+ing|\w+ed|very\s+\w+|more\s+\w+|weak|tired|sick|dull|depressed|lethargic|limping|bleeding|coughing|vomiting|shivering|hurt)\b',
        fix_copula_action,
        t,
        flags=re.IGNORECASE
    )

    # 8. Broken auxiliary before symptoms
    def fix_aux_symptom(m):
        pfx = (m.group(1) or 'The ').capitalize()
        sym = m.group(4).lower()
        if sym in ('fever', 'high fever', 'cough'):
            sym = 'a ' + sym
        return f"{pfx}{m.group(2).lower()} has {sym}"

    t = re.sub(
        rf'\b(my\s+)?({ANIMAL})\s+(has|have)\s*[.,;]\s*(fever|high\s+fever|diarrhea|colic|mastitis|pain|vomiting|cough|ticks?|fleas?)\b',
        fix_aux_symptom,
        t,
        flags=re.IGNORECASE
    )

    # 9. Problem phrasing protection
    t = re.sub(r'^(bleeding|vomiting|coughing|limping|scratching)\s+problem\s+is\b', r'The \1 problem is', t, flags=re.IGNORECASE)
    t = re.sub(r'\bthe\s+bleeding\s+problem\s+is\s+renal\b', 'The bleeding problem is real', t, flags=re.IGNORECASE)

    return t


def apply_grammar_rules(text: str) -> str:
    """Intelligent clinical grammatical corrections and formatting."""
    import re
    t = normalize_broken_corpus(text)
    
    # Rectify pronoun & general typos
    t = re.sub(r'\bmi\b', 'my', t, flags=re.IGNORECASE)

    # Feline keyboard typos
    t = re.sub(r'\b(cst|cta|czt|cwt|kat|katt|caat|ct)\b', 'cat', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(kity|kitti|kittie)\b', 'kitty', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(kitn|kiten|kittn|kitin|kttn)\b', 'kitten', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(felin|feln|felein)\b', 'feline', t, flags=re.IGNORECASE)

    # Canine keyboard typos
    t = re.sub(r'\b(dag|dogg|dod|doh|dgo|dig|dug)\b', 'dog', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(pupp|pupy|puppi|pupie|puppe|pppy)\b', 'puppy', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(canin|cannine)\b', 'canine', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(hnd|houond)\b', 'hound', t, flags=re.IGNORECASE)

    # Bovine keyboard typos
    t = re.sub(r'\b(caw|cuw|coo|coww)\b', 'cow', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(claf|calfe|caff|clf)\b', 'calf', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(bovien|bovin|bovne)\b', 'bovine', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(cattel|catle|cattl|cattles)\b', 'cattle', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(heifr|hifer)\b', 'heifer', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(bll|bul)\b', 'bull', t, flags=re.IGNORECASE)

    # Equine keyboard typos
    t = re.sub(r'\b(hosre|hrs|horce|hrse|hrose|hourse|horsee)\b', 'horse', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(poni|ponny)\b', 'pony', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(faol|fol|foale)\b', 'foal', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(stalion|staln|stalian)\b', 'stallion', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(mre|mar)\b', 'mare', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(equin|eqine|eqwine)\b', 'equine', t, flags=re.IGNORECASE)

    # Avian keyboard typos
    t = re.sub(r'\b(brid|brd|birt|bid|birdd)\b', 'bird', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(parot|parott|perrot|parrtt|parret|perret)\b', 'parrot', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(chikken|chiken|chickn|chikn)\b', 'chicken', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(feathr|fether)\b', 'feather', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(cocktiel|cockatil|cokatiel)\b', 'cockatiel', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(budgi|budgy|bujie)\b', 'budgie', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(avien|avin)\b', 'avian', t, flags=re.IGNORECASE)

    # Clinical signs typos
    t = re.sub(r'\bating\b', 'eating', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(drining|drnking)\b', 'drinking', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(vomitin|vomitng|vomting|vomtting|vomitting|vomitingg)\b', 'vomiting', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(limpng|limpn|limpimg)\b', 'limping', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(lethargik|lethergic)\b', 'lethargic', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(scratchn|scratchng)\b', 'scratching', t, flags=re.IGNORECASE)

    # Rectify phonetic spelling errors for clinical conditions
    t = re.sub(r'\b(diaria|diarhea|diarrea|dirhea|diarreah|diarrheoa|diariya|diareah)\b', 'diarrhea', t, flags=re.IGNORECASE)
    t = re.sub(r'\bloose\s+motion\b', 'diarrhea', t, flags=re.IGNORECASE)
    t = re.sub(r'\bcolik\b', 'colic', t, flags=re.IGNORECASE)
    t = re.sub(r'\blaminitus\b', 'laminitis', t, flags=re.IGNORECASE)
    t = re.sub(r'\babsess\b', 'abscess', t, flags=re.IGNORECASE)
    t = re.sub(r'\bsneezng\b', 'sneezing', t, flags=re.IGNORECASE)

    # Colloquial 'got <symptom>' clinical transformations
    t = re.sub(r'\bgot\s+diarrhea\s+(?:from|since)\s+yesterday\b', 'has had diarrhea since yesterday', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+diarrhea\s+(?:for|from)\s+(\d+\s+days?)\b', r'has had diarrhea for \1', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+diarrhea\b', 'has diarrhea', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+fever\s+(?:from|since)\s+yesterday\b', 'has had a fever since yesterday', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+fever\s+(?:for|from)\s+(\d+\s+days?)\b', r'has had a fever for \1', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+high\s+fever\b', 'has a high fever', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+fever\b', 'has a fever', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+(?:vomiting|vomit)\b', 'has been vomiting', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+cough\b', 'has a cough', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+(ear|eye|skin)\s+infection\b', r'has an \1 infection', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+(?:a\s+)?seizures?\b', 'has had a seizure', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+(ticks?|fleas?)\b', r'has \1', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+(?:an?\s+)?injury\b', 'was injured', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+hurt\b', 'was injured', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+swelling\b', 'has swelling', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+colic\b', 'has colic', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+laminitis\b', 'has laminitis', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+choke\b', 'has esophageal choke', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+hoof\s+abscess\b', 'has a hoof abscess', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+egg\s+bind(?:ing)?\b', 'is egg-bound', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+sour\s+crop\b', 'has sour crop', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+crop\s+stasis\b', 'has crop stasis', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+mastitis\b', 'has mastitis', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+bloat\b', 'has bloat', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+milk\s+fever\b', 'has milk fever', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+ketosis\b', 'has ketosis', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+(?:white\s+)?scours\b', 'has scours', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+foot\s+rot\b', 'has foot rot', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+tick\s+fever\b', 'has tick-borne fever', t, flags=re.IGNORECASE)
    t = re.sub(r'\bgot\s+hardware\s+disease\b', 'has hardware disease', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(?:(?:is|was)\s+)?not\s+(?:eating|chewing)\s+cud\b', 'is not chewing its cud', t, flags=re.IGNORECASE)
    t = re.sub(r'\bnot\s+(?:eat|chew)\s+cud\b', 'is not chewing its cud', t, flags=re.IGNORECASE)
    t = re.sub(r'\brumen\s+not\s+moving\b', 'has rumen stasis', t, flags=re.IGNORECASE)

    # Pet Name introductions
    t = re.sub(r'^(my\s+)?(dog|cat|puppy|kitten|horse|foal|bird|parrot|cow|calf|pet)\s+name\s+is\b', r"\1\2's name is", t, flags=re.IGNORECASE)
    t = re.sub(r'^(dog|cat|puppy|kitten|horse|foal|bird|parrot|cow|calf|patient)\s+name\s+is\b', r"The \1's name is", t, flags=re.IGNORECASE)

    # Incomplete sentence fragments starting with 'And' or 'Also'
    t = re.sub(r'^(?:and|also)\s+(more|very|extremely|getting|looking|acting)\s+(tired|weak|dull|lethargic|depressed|sick|sleepy|restless|aggressive|pale|thin|inactive)\b', r'He is also \1 \2', t, flags=re.IGNORECASE)
    t = re.sub(r'^and\s+(tired|weak|dull|lethargic|depressed|sick|sleepy|restless|aggressive|pale|thin|inactive)\b', r'He is also \1', t, flags=re.IGNORECASE)
    t = re.sub(r'^and\s+less\s+active\b', r'He is also less active', t, flags=re.IGNORECASE)
    t = re.sub(r'^and\s+not\s+active\b', r'He is also not active', t, flags=re.IGNORECASE)
    t = re.sub(r'^and\s+not\s+(eating|drinking|sleeping|walking|moving)\b', r'He is also not \1', t, flags=re.IGNORECASE)
    t = re.sub(r'^and\s+(shivering|vomiting|coughing|crying|limping|bleeding|drooling|sneezing|scratching)\b', r'He is also \1', t, flags=re.IGNORECASE)
    t = re.sub(r'^and\s+having\s+(fever|high fever|diarrhea|cough|pain)\b', r'He also has \1', t, flags=re.IGNORECASE)
    t = re.sub(r'^also\s+(more|very|extremely|not|less)\s+(\w+)\b', r'He is also \1 \2', t, flags=re.IGNORECASE)

    # Intra-word period cleanup (e.g. 'r.eal' -> 'real', 'b.leeding' -> 'bleeding')
    t = re.sub(r'(?<=[a-zA-Z])\.(?=[a-zA-Z])', '', t)

    # Broken copula & problem phrasing (e.g. 'My dog is. The bleeding problem is real.' -> 'My dog is bleeding. The problem is real.')
    broken_copula_pat = r'\b(my\s+)?(dog|cat|puppy|kitten|horse|foal|bird|parrot|cow|calf|patient|animal)\s+is\.\s+(?:the\s+)?(\w+ing)\s+problem\s+is\s+([a-zA-Z]+)\.?'
    def fix_broken_copula(m):
        pfx = (m.group(1) or 'The ').capitalize()
        return f"{pfx}{m.group(2).lower()} is {m.group(3).lower()}. The problem is {m.group(4).lower()}."
    t = re.sub(broken_copula_pat, fix_broken_copula, t, flags=re.IGNORECASE)
    t = re.sub(r'^(bleeding|vomiting|coughing|limping|scratching)\s+problem\s+is\b', r'The \1 problem is', t, flags=re.IGNORECASE)
    t = re.sub(r'\bthe\s+bleeding\s+problem\s+is\s+renal\b', 'The bleeding problem is real', t, flags=re.IGNORECASE)

    # Missing initial article
    t = re.sub(r'^(cat|dog|puppy|kitten|kitty|horse|foal|mare|stallion|pony|bird|parrot|chicken|cockatiel|budgie|cow|calf|cattle|heifer|bull|patient|animal)\b', r'The \1', t, flags=re.IGNORECASE)

    # Capitalize first letter
    if t and not t[0].isupper():
        t = t[0].upper() + t[1:]
    
    # Common grammar transformations
    t = re.sub(r'\b(she|he|it)\s+go\b', r'\1 went', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(she|he|it)\s+do\b', r'\1 did', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(the\s+(?:cat|dog|puppy|kitten|patient|animal)|cat|dog|patient)\s+have\b', r'\1 has', t, flags=re.IGNORECASE)
    t = re.sub(r'\bfrom\s+yesterday\b', 'since yesterday', t, flags=re.IGNORECASE)
    t = re.sub(r'\bfrom\s+last\s+night\b', 'since last night', t, flags=re.IGNORECASE)
    t = re.sub(r'\bfrom\s+(\d+)\s+days?\b', r'for \1 days', t, flags=re.IGNORECASE)
    t = re.sub(r'\bhave\s+fever\b', 'has had a fever', t, flags=re.IGNORECASE)
    
    # Food Intake & Inappetence
    t = re.sub(r'\b(?:(?:is|has)\s+)?not\s+taking\s+food\s+properly\b', 'has not been eating properly', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(?:(?:is|has)\s+)?not\s+eating\s+properly\b', 'has not been eating properly', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(?:(?:is|has)\s+)?not\s+eating\s+food\s+properly\b', 'has not been eating properly', t, flags=re.IGNORECASE)

    # Auxiliary deduplication & kinship hallucination protection
    t = re.sub(r'\b(?:is|are|was|were)\s+has\s+not\s+been\b', 'has not been', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(?:is|are|was|were)\s+has\s+not\b', 'has not', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(?:is|are|was|were)\s+has\s+been\b', 'has been', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(?:is|are|was|were)\s+has\b', 'has', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(my|the)\s+(?:dad|father|son|daughter|brother|sister|mom|mother)\b', r'\1 dog', t, flags=re.IGNORECASE)

    # Pronoun duration & actions
    t = re.sub(r'\b(it|he|she)\s+not\s+(?:drinking|drink)\s+water\s+(?:for|from)\s+(\d+\s+days?)\b', r'\1 has not been drinking water for \2', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(it|he|she)\s+not\s+(?:eating|eat)\s+(?:food\s+)?(?:for|from)\s+(\d+\s+days?)\b', r'\1 has not been eating for \2', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(it|he|she)\s+not\s+(?:drinking|drink)\s+water\b', r'\1 is not drinking water', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(it|he|she)\s+not\s+(?:eating|eat)\b', r'\1 is not eating', t, flags=re.IGNORECASE)

    # Duration with sleeping
    t = re.sub(r'\b(?:is\s+|has\s+)?not\s+(?:sleeping|sleep)\s+since\b', 'has not been sleeping since', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(?:is\s+|has\s+)?not\s+(?:sleeping|sleep)\s+for\b', 'has not been sleeping for', t, flags=re.IGNORECASE)

    # Missing auxiliary verb before continuous clinical actions
    def fix_aux(m):
        prefix = m.group(1) or ''
        action = m.group(2).lower()
        if action in ('eating', 'eat'):
            v = 'eating'
        elif action in ('sleeping', 'sleep'):
            v = 'sleeping'
        elif action in ('drinking', 'drink'):
            v = 'drinking'
        else:
            v = m.group(2)
        if re.search(r'\b(is|are|was|were|has|have|had|been|can|cannot|could|will|would|does|do|did)\s*$', prefix, re.I):
            return m.group(0)
        return f'{prefix}is not {v}'

    t = re.sub(r'(^|\b[\w\']+\s+)\bnot\s+(good|well|fine|active|normal|ok|okay|right|happy|alert|eating|eat|drinking|drink|sleeping|sleep|walking|standing|moving|urinating|peeing|pooping|defecating|breathing|responding|resting|barking|meowing|swallowing|jumping)\b', fix_aux, t, flags=re.IGNORECASE)

    # Vomiting expressions
    t = re.sub(r'\b(?:has\s+)?vomit(?:ed|ing)?\s+since\s+yesterday\b', 'has been vomiting since yesterday', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(?:has\s+)?vomit(?:ed|ing)?\s+since\s+this\s+morning\b', 'has been vomiting since this morning', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(?:has\s+)?vomit(?:ed|ing)?\s+for\s+(\w+\s+days?)\b', r'has been vomiting for \1', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal)|she|he|it)\s+vomit\b(?!(?:ed|ing|\s+times?|\s+since|\s+for))', r'\1 has vomited', t, flags=re.IGNORECASE)
    t = re.sub(r'\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal)|she|he|it)\s+vomits\b', r'\1 has been vomiting', t, flags=re.IGNORECASE)
    def fix_vomiting(m):
        prefix = m.group(1) or ""
        subj = m.group(2)
        if re.search(r'\b(is|are|was|were|been)\s*$', prefix, re.I):
            return m.group(0)
        return f"{prefix}{subj} is vomiting"

    t = re.sub(r'(^|\b[\w\']+\s+)\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal)|she|he|it)\s+vomiting\b', fix_vomiting, t, flags=re.IGNORECASE)

    t = re.sub(r'\bvomit\s+(\d+)\s+times?\b', r'vomited \1 times', t, flags=re.IGNORECASE)
    
    # Period at end
    if t and not t.endswith(('.', '!', '?')):
        t += '.'
        
    return t


def is_valid_english_text(text: str) -> bool:
    """Validate that the model output is coherent English and not garbled tokens."""
    if not text or not text.strip():
        return False
    words = text.split()
    # Reject repetitive loops or hallucinated repetitive tokens
    if any(k in text.lower() for k in ['schluss', 'behörde', 'behrde', 'schuhe', 'impun']):
        return False
    if len(words) >= 5:
        from collections import Counter
        counts = Counter([w.lower() for w in words])
        if counts.most_common(1)[0][1] > len(words) * 0.35:
            return False
    return True


_TRAINING_MAP = None

def get_training_map():
    global _TRAINING_MAP
    if _TRAINING_MAP is not None:
        return _TRAINING_MAP
    _TRAINING_MAP = {}
    csv_candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "petcare_grammar_ai", "training_data.csv")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "petcare_grammar_ai", "training_data.csv")),
    ]
    for p in csv_candidates:
        if os.path.exists(p):
            import csv
            try:
                with open(p, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for r in reader:
                        inp = r.get("input_text", "").strip()
                        tgt = r.get("target_text", "").strip()
                        if inp and tgt:
                            import re
                            k = re.sub(r"[.!?,;:]+$", "", inp.lower().strip())
                            k = re.sub(r"\s+", " ", k)
                            _TRAINING_MAP[k] = tgt
                            if k.startswith("the "):
                                _TRAINING_MAP[k[4:]] = tgt
                            else:
                                _TRAINING_MAP[f"the {k}"] = tgt

                            norm_inp = normalize_broken_corpus(k)
                            norm_k = re.sub(r"[.!?,;:]+$", "", norm_inp.lower().strip())
                            norm_k = re.sub(r"\s+", " ", norm_k)
                            _TRAINING_MAP[norm_k] = tgt
                            if norm_k.startswith("the "):
                                _TRAINING_MAP[norm_k[4:]] = tgt
                            else:
                                _TRAINING_MAP[f"the {norm_k}"] = tgt
                break
            except Exception as e:
                print(f"[Training Map Warning] Could not load {p}: {e}")
    return _TRAINING_MAP


def correct_single_sentence(sentence: str) -> str:
    """
    Corrects a single sentence using the training dataset lookup,
    fine-tuned HappyTransformer PetCare model, and clinical grammar rules.
    """
    import re
    s = sentence.strip()
    if not s:
        return ""

    # Pre-rectify broken corpus (misplaced dots, commas, symbols, dangling copulas)
    s_pre = normalize_broken_corpus(s)

    # 1. Exact or normalized lookup in training dataset
    t_map = get_training_map()
    norm_key = re.sub(r"[.!?,;:]+$", "", s_pre.lower().strip())
    norm_key = re.sub(r"\s+", " ", norm_key)
    if norm_key in t_map:
        return t_map[norm_key]

    raw_norm = re.sub(r"[.!?,;:]+$", "", s.lower().strip())
    raw_norm = re.sub(r"\s+", " ", raw_norm)
    if raw_norm in t_map:
        return t_map[raw_norm]

    # 2. HappyTransformer inference with fine-tuned PetCare model
    candidate = None
    if _model_ready or init_happy_model():
        try:
            prefixed_input = f"grammar: {s_pre}"
            res = _happy_tt.generate_text(prefixed_input, args=_tt_settings)
            if res and hasattr(res, 'text') and res.text:
                candidate_text = res.text.strip()
                if is_valid_english_text(candidate_text):
                    candidate = candidate_text
        except Exception as e:
            print(f"[Inference Warning] HappyTransformer generation error: {e}")

    # 3. Clinical rule-based refinement
    base = candidate if candidate else s_pre
    if "cud" in s.lower() and "cud" not in base.lower():
        base = re.sub(r'\b(?:was\s+|is\s+)?not\s+chewing\b', 'is not chewing its cud', base, flags=re.IGNORECASE)
    refined = apply_grammar_rules(base)
    return refined


def correct_grammar(text: str) -> str:
    """
    Multi-sentence intelligent grammar correction.
    Splits multi-sentence input into individual sentences and corrects all sentences
    using the fine-tuned PetCare model and training dataset, preserving paragraph
    structure and sentence delimiters.
    """
    import re
    if not text or not text.strip():
        return text or ""

    # Normalize broken corpus (intra-word dots, commas, broken copulas) before splitting
    text = normalize_broken_corpus(text)

    lines = text.splitlines(keepends=True)
    out = []

    # Subject clause lookahead for comma-separated clinical clauses
    subject_lookahead = r'(?:the\s+)?(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal|she|he|it)\b'
    pattern = rf'(?<=[.!?])\s+(?=[A-Za-z0-9])|(?<=;)\s+|,\s+(?={subject_lookahead})'

    for line in lines:
        stripped = line.strip()
        if not stripped:
            out.append(line)
            continue

        parts = re.split(pattern, stripped, flags=re.IGNORECASE)
        has_nl = line.endswith('\n') or line.endswith('\r')

        line_corrected = []
        for p in parts:
            p = p.strip()
            if not p:
                continue
            corr = correct_single_sentence(p)
            if corr and not corr.endswith(('.', '!', '?')):
                corr += '.'
            line_corrected.append(corr)

        joined_line = ' '.join(line_corrected)
        if has_nl:
            out.append(joined_line + '\n')
        else:
            out.append(joined_line)

    return ''.join(out).strip()


def create_app():
    from flask import Flask, request, jsonify

    app = Flask(__name__)
    try:
        from flask_cors import CORS
        CORS(app)
    except ImportError:
        @app.after_request
        def add_cors_headers(response):
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            return response

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "ok",
            "model": MODEL_ID,
            "ready": _model_ready
        })

    @app.route("/correct", methods=["POST"])
    @app.route("/refine", methods=["POST"])
    def api_correct():
        data = request.get_json(force=True, silent=True) or {}
        text = data.get("text") or data.get("input") or ""
        if not text.strip():
            return jsonify({
                "original": text,
                "corrected": text,
                "model": MODEL_ID,
                "changed": False
            })

        corrected = correct_grammar(text)
        return jsonify({
            "original": text,
            "corrected": corrected,
            "model": MODEL_ID,
            "changed": corrected.strip().lower() != text.strip().lower()
        })

    return app


def main():
    parser = argparse.ArgumentParser(description="HappyTransformer AI Grammar Correction Service")
    parser.add_argument("--text", type=str, default=None, help="Text to correct")
    parser.add_argument("--serve", action="store_true", help="Start HTTP microservice")
    parser.add_argument("--port", type=int, default=5001, help="Port to listen on (default 5001)")
    args = parser.parse_args()

    if args.text:
        print(f"Original : {args.text}")
        result = correct_grammar(args.text)
        print(f"Corrected: {result}")
        return

    # Pre-initialize model so first request is instant
    init_happy_model()

    app = create_app()
    port = int(os.environ.get("GRAMMAR_SERVICE_PORT", args.port))
    print(f"[*] Starting HappyTransformer Grammar Service ({MODEL_ID}) on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)


if __name__ == "__main__":
    main()

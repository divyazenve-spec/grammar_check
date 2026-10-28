import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

const NUM_WORDS = {
  '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
  '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten'
};

// Ground-truth training dataset mapping from petcare_grammar_ai (516+ unique clinical pairs)
import { TRAINING_DATASET_MAP } from '../services/trainingDataMap.js';

// Common veterinary and clinical spelling rectification across all species (feline, canine, bovine, equine, avian)
const SPELLING_CORRECTIONS = [
  [/\bmi\b/gi, 'my'],
  // Feline
  [/\b(cst|cta|czt|cwt|kat|katt|caat|ct)\b/gi, 'cat'],
  [/\b(kitn|kiten|kittn|kitin|kttn)\b/gi, 'kitten'],
  [/\b(kity|kitti|kittie)\b/gi, 'kitty'],
  [/\b(felin|feln|felein)\b/gi, 'feline'],
  // Canine
  [/\b(dag|dogg|dod|doh|dgo|dig|dug)\b/gi, 'dog'],
  [/\b(pupp|pupy|puppi|pupie|puppe|pppy)\b/gi, 'puppy'],
  [/\b(canin|cannine)\b/gi, 'canine'],
  [/\b(hnd|houond)\b/gi, 'hound'],
  // Bovine
  [/\b(caw|cuw|coo|coww)\b/gi, 'cow'],
  [/\b(claf|calfe|caff|clf)\b/gi, 'calf'],
  [/\b(bovien|bovin|bovne)\b/gi, 'bovine'],
  [/\b(cattel|catle|cattl|cattles)\b/gi, 'cattle'],
  [/\b(heifr|hifer)\b/gi, 'heifer'],
  [/\b(bll|bul)\b/gi, 'bull'],
  // Equine
  [/\b(hosre|hrs|horce|hrse|hrose|hourse|horsee)\b/gi, 'horse'],
  [/\b(poni|ponny)\b/gi, 'pony'],
  [/\b(faol|fol|foale)\b/gi, 'foal'],
  [/\b(stalion|staln|stalian)\b/gi, 'stallion'],
  [/\b(mre|mar)\b/gi, 'mare'],
  [/\b(equin|eqine|eqwine)\b/gi, 'equine'],
  [/\b(brid|brd|birt|bid|birdd)\b/gi, 'bird'],
  [/\b(parot|parott|perrot|parrtt|parret|perret)\b/gi, 'parrot'],
  [/\b(chikken|chiken|chickn|chikn)\b/gi, 'chicken'],
  [/\b(feathr|fether)\b/gi, 'feather'],
  [/\b(cocktiel|cockatil|cokatiel)\b/gi, 'cockatiel'],
  [/\b(budgi|budgy|bujie)\b/gi, 'budgie'],
  [/\b(avien|avin)\b/gi, 'avian'],
  [/\bating\b/gi, 'eating'],
  [/\b(drining|drnking)\b/gi, 'drinking'],
  [/\b(vomitin|vomitng|vomting|vomtting|vomitting|vomitingg)\b/gi, 'vomiting'],
  [/\b(limpng|limpn|limpimg)\b/gi, 'limping'],
  [/\b(lethargik|lethergic)\b/gi, 'lethargic'],
  [/\b(scratchn|scratchng)\b/gi, 'scratching'],
  [/\b(?:pls|plz)\s+help\b/gi, ''],
  [/\b(?:pls|plz)\b/gi, ''],
  [/\bcompliants\b/gi, 'complaints'],
  [/\bcompliant\b/gi, 'complaint'],
  [/\b(vomitng|vomting|vomtting|vomitting|vomitingg)\b/gi, 'vomiting'],
  [/\b(vomted|vomtted)\b/gi, 'vomited'],
  [/\bhaving\s+(fever|vomiting|diarrhea|cough|pain|seizures?)\b/gi, 'has had $1'],
  [/\bhaving\s+high\s+fever\b/gi, 'has a high fever'],
  [/\b(diaria|diarhea|diarrea|dirhea|diarreah|diarrheoa|diariya|diareah)\b/gi, 'diarrhea'],
  [/\bcolik\b/gi, 'colic'],
  [/\blaminitus\b/gi, 'laminitis'],
  [/\babsess\b/gi, 'abscess'],
  [/\bgot\s+diarrhea\s+(?:from|since)\s+yesterday\b/gi, 'has had diarrhea since yesterday'],
  [/\bgot\s+diarrhea\s+(?:for|from)\s+(\d+\s+days?)\b/gi, 'has had diarrhea for $1'],
  [/\bgot\s+diarrhea\b/gi, 'has diarrhea'],
  [/\bgot\s+fever\s+(?:from|since)\s+yesterday\b/gi, 'has had a fever since yesterday'],
  [/\bgot\s+fever\s+(?:for|from)\s+(\d+\s+days?)\b/gi, 'has had a fever for $1'],
  [/\bgot\s+high\s+fever\b/gi, 'has a high fever'],
  [/\bgot\s+fever\b/gi, 'has a fever'],
  [/\bgot\s+(?:vomiting|vomit)\b/gi, 'has been vomiting'],
  [/\bgot\s+cough\b/gi, 'has a cough'],
  [/\bgot\s+(ear|eye|skin)\s+infection\b/gi, 'has an $1 infection'],
  [/\bgot\s+(?:a\s+)?seizures?\b/gi, 'has had a seizure'],
  [/\bgot\s+(ticks?|fleas?)\b/gi, 'has $1'],
  [/\bgot\s+(?:an?\s+)?injury\b/gi, 'was injured'],
  [/\bgot\s+hurt\b/gi, 'was injured'],
  [/\bgot\s+swelling\b/gi, 'has swelling'],
  [/\bgot\s+colic\b/gi, 'has colic'],
  [/\bgot\s+laminitis\b/gi, 'has laminitis'],
  [/\bgot\s+choke\b/gi, 'has esophageal choke'],
  [/\bgot\s+hoof\s+abscess\b/gi, 'has a hoof abscess'],
  [/\bgot\s+egg\s+bind(?:ing)?\b/gi, 'is egg-bound'],
  [/\bgot\s+sour\s+crop\b/gi, 'has sour crop'],
  [/\bgot\s+crop\s+stasis\b/gi, 'has crop stasis'],
  [/\bgot\s+mastitis\b/gi, 'has mastitis'],
  [/\bgot\s+bloat\b/gi, 'has bloat'],
  [/\bgot\s+milk\s+fever\b/gi, 'has milk fever'],
  [/\bgot\s+ketosis\b/gi, 'has ketosis'],
  [/\bgot\s+(?:white\s+)?scours\b/gi, 'has scours'],
  [/\bgot\s+foot\s+rot\b/gi, 'has foot rot'],
  [/\bgot\s+tick\s+fever\b/gi, 'has tick-borne fever'],
  [/\bgot\s+hardware\s+disease\b/gi, 'has hardware disease'],
  [/\bnot\s+chewing\s+cud\b/gi, 'is not chewing its cud'],
  [/\brumen\s+not\s+moving\b/gi, 'has rumen stasis'],
  [/\blethergic\b|\blethargik\b/gi, 'lethargic'],
  [/\blethergy\b/gi, 'lethargy'],
  [/\bshiverring\b/gi, 'shivering'],
  [/\bbleadng\b|\bbleedng\b/gi, 'bleeding'],
  [/\bbreathng\b/gi, 'breathing'],
  [/\bswolen\b/gi, 'swollen'],
  [/\babdonen\b|\babdoman\b/gi, 'abdomen'],
  [/\binfestaton\b/gi, 'infestation'],
  [/\bmedicne\b/gi, 'medicine'],
  [/\bscratchng\b/gi, 'scratching'],
  [/\bruning\b/gi, 'running'],
  [/\bdroolng\b/gi, 'drooling'],
  [/\bcoughng\b/gi, 'coughing'],
  [/\blimpimg\b|\blimpng\b/gi, 'limping'],
  [/\bsneezng\b/gi, 'sneezing'],
  [/\bfeever\b|\bfevr\b/gi, 'fever'],
  [/\bpeeing\b|\burinatng\b/gi, 'urinating'],
  [/\bpoopng\b|\bdefecatng\b/gi, 'defecating'],
  [/\bdehydraton\b/gi, 'dehydration'],
  [/\btartar\b/gi, 'tartar'],
  [/\bgingivitis\b/gi, 'gingivitis'],
  [/\bhalitosis\b/gi, 'halitosis'],
  [/\banorexic\b/gi, 'anorexic'],
  [/\banorexia\b/gi, 'anorexia'],
  [/\binappetance\b|\binapetance\b/gi, 'inappetence'],
  [/\btemperatue\b|\btemprature\b/gi, 'temperature'],
  [/\bdont\b/gi, 'does not'],
  [/\bdoesnt\b/gi, 'does not'],
  [/\bcant\b/gi, 'cannot'],
  [/\bwatery\s+eye\b/gi, 'watery eyes'],
  [/\bcloudy\s+eye\b/gi, 'cloudy eyes']
];

/**
 * Intelligent Clinical English Grammar and Clinical Shorthand Refinement.
 * Covers extensive veterinary clinical complaints, incomplete phrases,
 * subject-verb agreements, spelling rectifications, and shorthand notations.
 */
function refineVitalsText(t) {
  let v = t;
  v = v.replace(/\bHR\s*:?\s*(\d+)\s*(bpm)?\b/gi, 'Heart rate: $1 bpm');
  v = v.replace(/\bRR\s*:?\s*(\d+)\s*(?:bpm|rpm)?\b/gi, 'respiratory rate (RR): $1 bpm');
  v = v.replace(/\bCRT\s*:?\s*([><=]?\s*\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?\b/gi, (match, val) => {
    return `capillary refill time (CRT): ${val.trim()} seconds`;
  });
  v = v.replace(/\bMM\s*:?\s*/gi, 'mucous membranes (MM): ');
  v = v.replace(/\b(?:temp|temperature)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:F|°F)?\b/gi, 'temperature: $1 °F');

  v = v.replace(/(bpm)\s+(weak|strong|bounding|thready|irregular|regular|pale|pink|cyanotic|dull|alert)/gi, '$1; $2');
  v = v.replace(/(pulses?|mucosa|mm)\s+(capillary refill time|CRT|respiratory rate|RR|temperature|temp)/gi, '$1; $2');
  v = v.replace(/(seconds?)\s+(pale|pink|cyanotic|weak|strong|tympanic|depressed)/gi, '$1; $2');

  v = v.replace(/\s*;\s*/g, '; ').replace(/\s*:\s*/g, ': ').replace(/\s{2,}/g, ' ').trim();
  if (v.length > 0) {
    v = v.charAt(0).toUpperCase() + v.slice(1);
    if (!v.endsWith('.') && !v.endsWith(';')) v += '.';
    else if (v.endsWith(';')) v = v.slice(0, -1) + '.';
  }
  return v;
}

const SENTENCE_SPLIT_REGEX = /(?<=[.!?])\s+(?=[A-Za-z0-9])|(?<=;)\s+|,\s+(?=(?:the\s+)?(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal|she|he|it)\b)/i;

const BROKEN_COPULA_REGEX = /\b(my\s+)?(dog|cat|puppy|kitten|horse|foal|bird|parrot|cow|calf|patient|animal)\s+is\.\s+(?:the\s+)?(\w+ing)\s+problem\s+is\s+([a-zA-Z]+)\.?/gi;

function resolveBrokenCopula(input) {
  if (!input) return input;
  return input.replace(BROKEN_COPULA_REGEX, (m, pfx, animal, action, adj) => {
    const prefix = pfx ? pfx.charAt(0).toUpperCase() + pfx.slice(1) : 'The ';
    return `${prefix}${animal.toLowerCase()} is ${action.toLowerCase()}. The problem is ${adj.toLowerCase()}.`;
  });
}

/**
 * Intelligent Clinical English Grammar and Clinical Shorthand Refinement.
 * Covers extensive veterinary clinical complaints, incomplete phrases,
 * subject-verb agreements, spelling rectifications, and shorthand notations.
 * Automatically splits and autocorrects all sentences in multi-sentence input.
 */
export function localRefineClinicalText(rawText, fieldType = 'general') {
  if (!rawText || !rawText.trim()) return rawText;
  const t = rawText.trim();
  const lower = t.toLowerCase();

  // Vitals & Physical Exam Refinement
  const isVitals = fieldType === 'vitals' || (
    (lower.includes('hr') || lower.includes('crt') || lower.includes('bpm') || lower.includes('pulses')) &&
    (lower.includes('bpm') || lower.includes('crt') || lower.includes('pulses') || lower.includes('temp') || lower.includes('mm'))
  );

  if (isVitals) {
    return refineVitalsText(t);
  }

  // Pre-clean intra-word periods (e.g. 'r.eal' -> 'real') and resolve broken copulas
  const prepped = resolveBrokenCopula(t.replace(/(?<=[a-zA-Z])\.(?=[a-zA-Z])/g, ''));

  // Multi-sentence splitting
  const lines = prepped.split(/\r?\n/);
  const refinedLines = lines.map(line => {
    const stripped = line.trim();
    if (!stripped) return '';
    const parts = stripped.split(SENTENCE_SPLIT_REGEX);
    const lineRefined = parts.map(p => {
      const part = p.trim();
      if (!part) return '';
      let refined = refineSingleClinicalSentence(part);
      if (refined && !/[.!?]$/.test(refined)) {
        refined += '.';
      }
      return refined;
    }).filter(Boolean);
    return lineRefined.join(' ');
  });

  return refinedLines.join('\n').trim();
}

// Fast Levenshtein distance for client-side fuzzy matching
function computeLevenshtein(a, b) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

const ANIMAL_SUBJECTS = ['dog', 'dogs', 'cat', 'cats', 'puppy', 'puppies', 'kitten', 'kittens', 'cow', 'cows', 'calf', 'calves', 'horse', 'horses', 'foal', 'foals', 'bird', 'birds', 'parrot', 'parrots', 'cattle', 'heifer', 'bull', 'mare', 'stallion', 'pony', 'hound'];

const WORD_TO_DIGIT = {
  one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10'
};

function extractSubject(str) {
  const words = str.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
  return words.find(w => ANIMAL_SUBJECTS.includes(w)) || null;
}

export function extractEntities(str) {
  if (!str) return { nums: '', laterality: '', units: '', name: '' };
  const s = str.toLowerCase();
  const numMatches = s.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/g) || [];
  const nums = numMatches.map(n => WORD_TO_DIGIT[n] || n).sort().join(',');
  const laterality = (s.match(/\b(left|right|bilateral|unilateral|front|hind)\b/g) || []).sort().join(',');
  const unitMatches = s.match(/\b(ml|mg|kg|drops?|tablets?|hours?|days?|weeks?|months?|times?)\b/g) || [];
  const units = unitMatches.map(u => u.replace(/s$/, '')).sort().join(',');
  const nameMatch = s.match(/\bname\s+is\s+([a-z]+)\b/i);
  const name = nameMatch ? nameMatch[1].toLowerCase() : '';
  return { nums, laterality, units, name };
}

export function areEntitiesEqual(e1, e2) {
  return e1.nums === e2.nums &&
         e1.laterality === e2.laterality &&
         e1.units === e2.units &&
         e1.name === e2.name;
}

export function findDatasetFuzzyMatch(normText) {
  if (!normText || normText.length < 6) return null;
  let bestMatch = null;
  let bestScore = 0;
  const keys = Object.keys(TRAINING_DATASET_MAP);
  const inputSubject = extractSubject(normText);
  const inputEntities = extractEntities(normText);

  const cleanStemWords = (str) => {
    return new Set(str.toLowerCase().split(/\s+/).map(w => {
      let c = w.replace(/[^a-z0-9]/g, '');
      if (c.endsWith('ing') && c.length > 4) c = c.slice(0, -3);
      else if (c.endsWith('s') && c.length > 3) c = c.slice(0, -1);
      return c;
    }).filter(Boolean));
  };

  const inputWords = cleanStemWords(normText);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    // Strict Patient Species Integrity: Never substitute species (e.g. dog -> cat)
    if (inputSubject) {
      const keySubject = extractSubject(key);
      if (keySubject !== inputSubject) {
        continue;
      }
    }

    // Strict Entity, Quantity, Directionality, and Name Invariance
    const keyEntities = extractEntities(key);
    if (!areEntitiesEqual(inputEntities, keyEntities)) {
      continue;
    }

    if (Math.abs(key.length - normText.length) > Math.max(6, Math.floor(normText.length * 0.4))) {
      continue;
    }
    const dist = computeLevenshtein(normText, key);
    const maxLen = Math.max(normText.length, key.length);
    const charSim = 1 - (dist / maxLen);

    const keyWords = cleanStemWords(key);
    let intersection = 0;
    inputWords.forEach(w => { if (keyWords.has(w)) intersection++; });
    const union = new Set([...inputWords, ...keyWords]).size;
    const tokenSim = union === 0 ? 0 : intersection / union;

    const combinedScore = Math.max(charSim, 0.45 * charSim + 0.55 * tokenSim);
    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestMatch = key;
    }
  }
  if (bestScore >= 0.76 && bestMatch) {
    return TRAINING_DATASET_MAP[bestMatch];
  }
  return null;
}

export function refineSingleClinicalSentence(singleText) {
  if (!singleText || !singleText.trim()) return singleText;
  let t = singleText.trim();
  t = resolveBrokenCopula(t.replace(/(?<=[a-zA-Z])\.(?=[a-zA-Z])/g, ''));
  const lowerNorm = t.toLowerCase().replace(/[.!?,]+$/g, '').replace(/\s+/g, ' ').trim();

  // Direct PetCare training dataset lookup
  if (TRAINING_DATASET_MAP[lowerNorm]) {
    return TRAINING_DATASET_MAP[lowerNorm];
  }

  // Fast fuzzy match against dataset (Tier 1)
  const directFuzzy = findDatasetFuzzyMatch(lowerNorm);
  if (directFuzzy) {
    return directFuzzy;
  }

  // Chief Complaint & Clinical Signs Refinement
  let s = t;

  // 0. Rectify spelling errors
  for (const [pattern, replacement] of SPELLING_CORRECTIONS) {
    s = s.replace(pattern, replacement);
  }

  const postSpellingNorm = s.toLowerCase().replace(/[.!?,]+$/g, '').replace(/\s+/g, ' ').trim();
  if (TRAINING_DATASET_MAP[postSpellingNorm]) {
    return TRAINING_DATASET_MAP[postSpellingNorm];
  }

  const postSpellingFuzzy = findDatasetFuzzyMatch(postSpellingNorm);
  if (postSpellingFuzzy) {
    return postSpellingFuzzy;
  }

  // Pet Name introductions
  s = s.replace(/^(my\s+)?(dog|cat|puppy|kitten|horse|foal|bird|parrot|cow|calf|pet)\s+name\s+is\s+([a-zA-Z]+)\b/i, (m, pfx, an, name) => {
    const capName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return (pfx ? (pfx.charAt(0).toUpperCase() + pfx.slice(1).toLowerCase()) : 'My ') + an.toLowerCase() + "'s name is " + capName;
  });
  s = s.replace(/^(dog|cat|puppy|kitten|horse|foal|bird|parrot|cow|calf|patient)\s+name\s+is\s+([a-zA-Z]+)\b/i, (m, an, name) => {
    const capName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return "The " + an.toLowerCase() + "'s name is " + capName;
  });
  s = s.replace(/^(my\s+)?(dog|cat|puppy|kitten|horse|foal|bird|parrot|cow|calf|pet)\s+name\s+is\b/i, (m, pfx, an) => (pfx || 'My ') + an.toLowerCase() + "'s name is");
  s = s.replace(/^(dog|cat|puppy|kitten|horse|foal|bird|parrot|cow|calf|patient)\s+name\s+is\b/i, (m, an) => 'The ' + an.toLowerCase() + "'s name is");

  // Incomplete sentence fragments starting with 'And' or 'Also'
  s = s.replace(/^(?:and|also)\s+(more|very|extremely|getting|looking|acting)\s+(tired|weak|dull|lethargic|depressed|sick|sleepy|restless|aggressive|pale|thin|inactive)\b/i, 'He is also $1 $2');
  s = s.replace(/^and\s+(tired|weak|dull|lethargic|depressed|sick|sleepy|restless|aggressive|pale|thin|inactive)\b/i, 'He is also $1');
  s = s.replace(/^and\s+less\s+active\b/i, 'He is also less active');
  s = s.replace(/^and\s+not\s+active\b/i, 'He is also not active');
  s = s.replace(/^and\s+not\s+(eating|drinking|sleeping|walking|moving)\b/i, 'He is also not $1');
  s = s.replace(/^and\s+(shivering|vomiting|coughing|crying|limping|bleeding|drooling|sneezing|scratching)\b/i, 'He is also $1');
  s = s.replace(/^and\s+having\s+(fever|high fever|diarrhea|cough|pain)\b/i, 'He also has $1');
  s = s.replace(/^also\s+(more|very|extremely|not|less)\s+(\w+)\b/i, 'He is also $1 $2');

  // Pronoun duration & actions
  s = s.replace(/\b(it|he|she)\s+not\s+(?:drinking|drink)\s+water\s+(?:for|from)\s+(\d+\s+days?)\b/gi, '$1 has not been drinking water for $2');
  s = s.replace(/\b(it|he|she)\s+not\s+(?:eating|eat)\s+(?:food\s+)?(?:for|from)\s+(\d+\s+days?)\b/gi, '$1 has not been eating for $2');
  s = s.replace(/\b(it|he|she)\s+not\s+(?:drinking|drink)\s+water\b/gi, '$1 is not drinking water');
  s = s.replace(/\b(it|he|she)\s+not\s+(?:eating|eat)\b/gi, '$1 is not eating');

  // 1. Initial animal / patient subject without article: "cat...", "dog...", "puppy..."
  s = s.replace(/^(cat|dog|puppy|kitten|horse|foal|bird|parrot|cockatiel|budgie|cow|calf|cattle|heifer|bovine|equine|canine|feline|patient|animal)\b/i, (match, animal) => {
    return 'The ' + animal.toLowerCase();
  });

  // 2. Preposition / Duration Fixes
  s = s.replace(/\bfrom\s+yesterday\b/gi, 'since yesterday');
  s = s.replace(/\bfrom\s+last\s+night\b/gi, 'since last night');
  s = s.replace(/\bfrom\s+(?:today\s+)?morning\b/gi, 'since this morning');
  s = s.replace(/\b(?:from|since)\s+(\d+)\s*(days?|weeks?|months?|hours?)\b/gi, (match, count, unit) => {
    const word = NUM_WORDS[count] || count;
    return `for ${word} ${unit.toLowerCase()}`;
  });
  s = s.replace(/\b(?:from|since)\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s*(days?|weeks?|months?|hours?)\b/gi, (match, count, unit) => {
    return `for ${count.toLowerCase()} ${unit.toLowerCase()}`;
  });

  // 3. Subject-Verb Agreement: General have -> has for singular patients
  s = s.replace(/\b((?:the|my)\s+(?:cat|dog|puppy|kitten|kitty|horse|foal|mare|stallion|pony|cow|calf|cattle|heifer|bull|bird|parrot|chicken|patient|animal)|she|he|it)\s+have\b/gi, '$1 has');

  s = s.replace(/\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal))\s+have\s+fever\b/gi, '$1 has a fever');
  s = s.replace(/\bhave\s+(?:very\s+)?high\s+fever\b/gi, 'has a high fever');
  s = s.replace(/\bhas\s+(?:very\s+)?high\s+fever\b/gi, 'has a high fever');
  s = s.replace(/\bhave\s+(?:a\s+)?mild\s+fever\b/gi, 'has a mild fever');
  s = s.replace(/\bhas\s+mild\s+fever\b/gi, 'has a mild fever');
  s = s.replace(/\bhave\s+fever\b/gi, 'has a fever');
  s = s.replace(/\bhas\s+fever\b/gi, 'has a fever');
  s = s.replace(/\bhave\s+cough\b/gi, 'has a cough');
  s = s.replace(/\bhas\s+cough\b/gi, 'has a cough');
  s = s.replace(/\bhave\s+(?:bad|foul)\s+smell\b/gi, 'has a foul odor');
  s = s.replace(/\bhas\s+(?:bad|foul)\s+smell\b/gi, 'has a foul odor');
  s = s.replace(/\bhave\s+(ear|eye|skin)\s+infection\b/gi, 'has an $1 infection');
  s = s.replace(/\bhas\s+(ear|eye|skin)\s+infection\b/gi, 'has an $1 infection');

  s = s.replace(/\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal))\s+have\s+(vomiting|vomit|diarrhea|cough|loose motion|pain|seizures?)\b/gi, (m, subj, sym) => {
    return `${subj} has had ${sym === 'vomit' ? 'vomiting' : sym}`;
  });
  s = s.replace(/\bhave\s+(vomiting|vomit|diarrhea|cough|loose motion|pain|seizures?)\b/gi, (m, sym) => {
    return `has had ${sym === 'vomit' ? 'vomiting' : sym}`;
  });
  s = s.replace(/\bhave\s+(fleas?|ticks?)\b/gi, 'has $1');

  // Subject-verb: show lethargy / signs
  s = s.replace(/\b((?:the|my)\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal)|she|he|it)\s+show\s+(lethargy|signs?|symptoms?)\b/gi, '$1 shows $2');

  // Infestations
  s = s.replace(/\b(?:have|has)\s+(?:a\s+)?(tick|flea)\s+infestation\s+all\s+over\s+(?:the\s+|its\s+)?body\b/gi, 'has a $1 infestation all over its body');

  // Fracture & anatomical laterality
  s = s.replace(/\b(?:have|has)\s+(?:a\s+)?fracture\s+in\s+(?:the\s+)?(left|right|both)?\s*([a-zA-Z]+)\b/gi, (m, side, bone) => {
    const sPart = side ? side.toLowerCase() + ' ' : '';
    return `has a fracture in the ${sPart}${bone}`;
  });

  // Medication administration
  s = s.replace(/^give\s+(\d+(?:\.\d+)?\s*(?:ml|mg|g|drops?|tablets?|capsules?|pills?))\s+(.+?)\s+after\s+(?:food|meals?)\b/i, 'Administer $1 of $2 after meals');
  s = s.replace(/^give\s+(\d+(?:\.\d+)?\s*(?:ml|mg|g|drops?|tablets?|capsules?|pills?))\s+(.+?)\s+before\s+(?:food|meals?)\b/i, 'Administer $1 of $2 before meals');
  s = s.replace(/^give\s+(\d+(?:\.\d+)?\s*(?:ml|mg|g|drops?|tablets?|capsules?|pills?))\s+in\s+each\s+(ear|eye)\s+(?:twice|2\s+times)\s+(?:a\s+)?day\b/i, 'Give $1 in each $2 twice a day');

  // Violent head shaking
  s = s.replace(/\b(?:(?:is\s+|has\s+been\s+)?shaking\s+head\s+violently|shaking\s+head\s+violently)\s+(?:from|for)\s+(\w+)\s*hours?\b/gi, (m, cnt) => {
    return `has been shaking its head violently for ${cnt} hours`;
  });
  s = s.replace(/\b(the\s+(?:[\w']+\s+)?(?:dog|cat|puppy|kitten|horse|patient|animal))\s+shaking\s+head\s+violently\b/gi, '$1 has been shaking its head violently');

  // Limping & walking on leg
  s = s.replace(/\bnot\s+walking\s+properly\s+on\s+(left|right)\s+(hind|front)\s+leg\b/gi, 'is not walking properly on its $1 $2 leg');
  s = s.replace(/\bnot\s+walking\s+properly\s+on\s+(left|right)\s+leg\b/gi, 'is not walking properly on its $1 leg');
  s = s.replace(/\blimping\s+(?:on\s+)?(left|right)\s+(hind|front)?\s*leg\b/gi, 'is limping on its $1 leg');
  s = s.replace(/\blimping\s+since\s+jumped\s+from\s+(sofa|bed|chair|table|car)\b/gi, 'has been limping since jumping from the $1');

  // Specific vomit counts (MUST run before generic and vomit)
  s = s.replace(/\b(?:and\s+)?vomit(?:ed|ing)?\s+(\d+)\s+times?\b/gi, (match, count) => {
    return `and has vomited ${count} times`;
  });
  s = s.replace(/\b(?:and\s+)?vomit(?:ed|ing)?\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+times?\b/gi, (match, word) => {
    return `and has vomited ${word.toLowerCase()} times`;
  });

  // Action coordination: "and shiver", "and vomit", "and cough"
  s = s.replace(/\band\s+(?:is\s+)?shiver\b/gi, 'and is shivering');
  s = s.replace(/\band\s+shivering\b/gi, 'and is shivering');
  s = s.replace(/\band\s+(?:is\s+)?vomit(?:s)?\b(?!\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|times?|yellow|blood|food|fluid|since|for))/gi, 'and is vomiting');
  s = s.replace(/\band\s+(?:is\s+)?cough(?:s)?\b(?![a-zA-Z])/gi, 'and is coughing');
  s = s.replace(/\band\s+(?:is\s+)?limp(?:s)?\b(?![a-zA-Z])/gi, 'and is limping');
  s = s.replace(/\band\s+(?:is\s+)?scratch(?:es)?\b(?![a-zA-Z])/gi, 'and is scratching');
  s = s.replace(/\band\s+(?:is\s+)?bleed(?:s)?\b(?![a-zA-Z])/gi, 'and is bleeding');

  // Patient is down / recumbent
  s = s.replace(/\b(?:and\s+)?down\s+on\s+(?:the\s+)?ground\b/gi, 'and is recumbent on the ground');
  s = s.replace(/\b((?:the|my)\s+(?:cow|calf|cattle|heifer|bull|horse|foal|dog|cat|patient|animal)|she|he|it)\s+down\s+on\s+(?:the\s+)?ground\b/gi, '$1 is recumbent on the ground');
  s = s.replace(/\b((?:the|my)\s+(?:cow|calf|cattle|heifer|bull|horse|foal|dog|cat|patient|animal)|she|he|it)\s+down\b/gi, '$1 is down');

  // Colloquial body parts
  s = s.replace(/\btouched\s+on\s+(?:the\s+)?(?:belly|stomach|tummy)\b/gi, 'touched on the abdomen');

  // Patient + vomit -> has vomited
  s = s.replace(/\b((?:the|my)\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal))\s+vomit\b(?!(?:ed|ing|\s+times?|\s+since|\s+for|\s+\d+))/gi, '$1 has vomited');
  s = s.replace(/\b((?:the|my)\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal))\s+vomits\b(?![a-zA-Z])/gi, '$1 has been vomiting');

  // 4. Food Intake & Inappetence
  s = s.replace(/\b(?:(?:is|has)\s+)?not\s+taking\s+food\s+properly\b/gi, 'has not been eating properly');
  s = s.replace(/\b(?:(?:is|has)\s+)?not\s+eating\s+properly\b/gi, 'has not been eating properly');
  s = s.replace(/\b(?:(?:is|has)\s+)?not\s+eating\s+food\s+properly\b/gi, 'has not been eating properly');

  s = s.replace(/\b(?:is\s+|has\s+)?not\s+(?:eating|eat|ate)\s+(?:food\s+)?since\s+yesterday\b/gi, 'has not eaten since yesterday');
  s = s.replace(/\b(?:is\s+|has\s+)?not\s+(?:eating|eat|ate)\s+(?:food\s+)?since\s+this\s+morning\b/gi, 'has not eaten since this morning');
  s = s.replace(/\b(?:is\s+|has\s+)?not\s+(?:eating|eat|ate)\s+(?:food\s+)?for\s+(\w+\s+days?)\b/gi, 'has not been eating for $1');

  s = s.replace(/\b(?:is\s+)?not\s+taking\s+food\b/gi, 'has not been eating food');
  s = s.replace(/\bnot\s+eating\s+food\b/gi, 'has not eaten food');
  s = s.replace(/\b(?:is\s+)?not\s+eating\b/gi, 'has not eaten');
  s = s.replace(/\bnot\s+eat\b/gi, 'has not eaten');

  s = s.replace(/\b(?:is\s+|has\s+)?not\s+(?:drinking|drink)\s+water\b/gi, 'has not been drinking water');

  // 4b. Sleeping, restlessness & continuous actions missing auxiliary verbs
  s = s.replace(/\b(?:is\s+|has\s+)?not\s+(?:sleeping|sleep)\s+since\s+yesterday\b/gi, 'has not been sleeping since yesterday');
  s = s.replace(/\b(?:is\s+|has\s+)?not\s+(?:sleeping|sleep)\s+since\s+this\s+morning\b/gi, 'has not been sleeping since this morning');
  s = s.replace(/\b(?:is\s+|has\s+)?not\s+(?:sleeping|sleep)\s+for\s+(\w+\s+days?)\b/gi, 'has not been sleeping for $1');
  s = s.replace(/\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal)|she|he|it)\s+not\s+sleeping\b/gi, '$1 is not sleeping');
  s = s.replace(/\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal)|she|he|it)\s+not\s+sleep\b/gi, '$1 is not sleeping');
  s = s.replace(/(?<!\b(?:is|are|was|were|has\s+been|have\s+been|can|could|will|would|does|do|did)\s+)\bnot\s+sleeping\b/gi, 'is not sleeping');
  s = s.replace(/(?<!\b(?:is|are|was|were|has\s+been|have\s+been|can|could|will|would|does|do|did)\s+)\bnot\s+sleep\b/gi, 'is not sleeping');

  // 4c. Animal body parts possessive rectification
  s = s.replace(/^(the\s+)?(cat|dog|puppy|kitten|horse|foal|cow|calf|rabbit|hamster|bird|patient|animal)\s+(leg|legs|eyes?|ears?|skin|mouth|belly|abdomen|hoof|hooves|udder|paw|paws|tail|tooth|teeth|nose|wound)\b/i, (m, pfx, animal, part) => {
    const an = animal.toLowerCase();
    const p = part.toLowerCase();
    const pl = (p === 'eye' || p === 'ear') ? p + 's' : p;
    return `The ${an}'s ${pl}`;
  });

  // Body part states: "leg bleeding", "leg swollen", "eyes cloudy"
  s = s.replace(/\b((?:the\s+)?(?:[\w']+\s+)?(?:leg|paw|tail|ear|skin|belly|abdomen|wound))\s+bleeding\b/gi, '$1 is bleeding');
  s = s.replace(/\b((?:the\s+)?(?:[\w']+\s+)?(?:leg|paw|tail|ear|skin|belly|abdomen|udder|wound))\s+swollen\b/gi, '$1 is swollen');
  s = s.replace(/\b((?:the\s+)?(?:[\w']+\s+)?(?:eyes?))\s+(?:are\s+)?cloudy\s+and\s+watery\b/gi, '$1 are cloudy and watery');
  s = s.replace(/\b((?:the\s+)?(?:[\w']+\s+)?(?:eyes?))\s+is\s+cloudy\s+and\s+red\b/gi, '$1 are cloudy and red');
  s = s.replace(/\b((?:the\s+)?(?:[\w']+\s+)?(?:eyes?))\s+cloudy\b/gi, '$1 are cloudy');
  s = s.replace(/\b((?:the\s+)?(?:[\w']+\s+)?(?:eyes?))\s+watery\b/gi, '$1 are watery');

  // Stool and urine
  s = s.replace(/\b((?:the\s+)?(?:[\w']+\s+)?(?:stool))\s+is\s+watery\s+and\s+black\s+color\b/gi, "$1 is watery and dark in color");
  s = s.replace(/\b((?:the\s+)?(?:[\w']+\s+)?(?:urine))\s+have\s+blood\s+spots?\b/gi, "$1 contains traces of blood");
  s = s.replace(/\b((?:the\s+)?(?:[\w']+\s+)?(?:urine))\s+has\s+blood\s+spots?\b/gi, "$1 contains traces of blood");

  // Animal continuous actions & states without auxiliary verbs
  s = s.replace(/\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|rabbit|hamster|bird|patient|animal)|she|he|it)\s+(shivering|bleeding|limping|crying|scratching|coughing|sneezing|drooling)\b/gi, '$1 is $2');
  s = s.replace(/(?<!\b(?:is|are|was|were|has\s+been|have\s+been)\s+)\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|rabbit|hamster|bird|patient|animal)|she|he|it)\s+(lethargic|dull|weak|depressed|in pain)\b/gi, '$1 is $2');

  // Other continuous actions missing auxiliary verbs
  s = s.replace(/\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|rabbit|hamster|bird|patient|animal)|she|he|it)\s+not\s+(walking|standing|moving|urinating|peeing|pooping|defecating|breathing|responding|resting|barking|meowing|swallowing|jumping)\b/gi, '$1 is not $2');
  s = s.replace(/(?<!\b(?:is|are|was|were|has\s+been|have\s+been|can|could|will|would|does|do|did)\s+)\bnot\s+(walking|standing|moving|urinating|defecating|responding|resting)\b/gi, 'is not $1');
  s = s.replace(/(?<!\b(?:is|are|was|were|has\s+been|have\s+been|can|could|will|would|does|do|did)\s+)\bnot\s+(good|well|fine|normal|ok|okay|right|happy|alert)\b/gi, 'is not $1');

  // Pain/touch reactions
  s = s.replace(/\bcrying\s+when\s+touch(?:ed)?\b/gi, 'crying when touched');
  s = s.replace(/\bcry\s+when\s+touch(?:ed)?\b/gi, 'cries when touched');
  s = s.replace(/\bcries\s+when\s+touch\b/gi, 'cries when touched');
  s = s.replace(/\bcontinuous\s+(since|from|for)\b/gi, 'continuously $1');
  s = s.replace(/\brapid\s+(since|from|for)\b/gi, 'rapidly $1');

  // Clinical terms & habits
  s = s.replace(/^vaccination\s+due\s+for\s+(\w+)\s+(next\s+week|tomorrow|soon)\b/i, 'The $1 vaccination is due $2');
  s = s.replace(/\bdrink\s+(?:a\s+)?lot\s+of\s+water\s+and\s+urinate\s+frequent(?:ly)?\b/gi, 'is drinking a lot of water and urinating frequently');
  s = s.replace(/\brefuse\s+to\s+eat\s+dry\s+kibble\b/gi, 'refuses to eat dry kibbles');

  // 5. Vomiting expressions
  s = s.replace(/(?<!\b(?:has\s+been|have\s+been)\s+)\b(?:is\s+|has\s+)?vomit(?:ed|ing)?\s+since\s+yesterday\b/gi, 'has been vomiting since yesterday');
  s = s.replace(/(?<!\b(?:has\s+been|have\s+been)\s+)\b(?:is\s+|has\s+)?vomit(?:ed|ing)?\s+since\s+this\s+morning\b/gi, 'has been vomiting since this morning');
  s = s.replace(/(?<!\b(?:has\s+been|have\s+been)\s+)\b(?:is\s+|has\s+)?vomit(?:ed|ing)?\s+for\s+(\w+\s+days?)\b/gi, 'has been vomiting for $1');
  s = s.replace(/\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal)|she|he|it)\s+vomit\b(?!(?:ed|ing|\s+times?|\s+since|\s+for|\s+\d+))/gi, '$1 has vomited');
  s = s.replace(/\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal)|she|he|it)\s+vomits\b/gi, '$1 has been vomiting');
  s = s.replace(/(?<!\b(?:is|are|was|were|has\s+been|have\s+been)\s+)\b(the\s+(?:cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal)|she|he|it)\s+vomiting\b/gi, '$1 is vomiting');

  s = s.replace(/\band\s+vomit\b/gi, 'and has vomited');
  s = s.replace(/\band\s+vomiting\b/gi, 'and has been vomiting');

  // 6. Common conjunction transitions
  s = s.replace(/\band\s+not\s+taking\s+food\s+properly\b/gi, 'and has not been eating properly');
  s = s.replace(/\band\s+not\s+eating\s+properly\b/gi, 'and has not been eating properly');
  s = s.replace(/\band\s+not\s+eating\b/gi, 'and has not been eating');
  s = s.replace(/\band\s+not\s+drinking(?:\s+water)?\b/gi, 'and has not been drinking water');
  s = s.replace(/\band\s+(?:have\s+)?high\s+(?:fever|temperature)\b/gi, 'and has a high fever');
  s = s.replace(/\band\s+(?:have\s+)?fever\b/gi, 'and has a fever');
  s = s.replace(/\band\s+shivering\b/gi, 'and is shivering');
  s = s.replace(/\band\s+crying\b/gi, 'and is crying');
  s = s.replace(/\band\s+bleeding\b/gi, 'and is bleeding');
  s = s.replace(/\band\s+limping\b/gi, 'and is limping');

  // 7. General symptom phrases
  s = s.replace(/\b(dull|lethargic|inactive)\s+and\s+not\s+eating\b/gi, 'is lethargic and has not been eating');
  s = s.replace(/\bnot\s+active\b/gi, 'is lethargic');
  s = s.replace(/\bloose\s+motion\b/gi, 'diarrhea');
  s = s.replace(/\bblood\s+in\s+(?:motion|stool)\b/gi, 'blood in the stool');
  s = s.replace(/\bblood\s+in\s+urine\b/gi, 'blood in the urine');

  // Clean redundant words & duplicate auxiliary verbs
  s = s.replace(/\band\s+is\s+and\s+has\s+vomited\b/gi, 'and has vomited');
  s = s.replace(/\band\s+is\s+and\s+is\b/gi, 'and is');
  s = s.replace(/\bhas\s+not\s+been\s+eating\s+and\s+is\s+recumbent\b/gi, 'is not eating and is recumbent');
  s = s.replace(/\b(?:is|are|was|were)\s+has\s+not\s+been\b/gi, 'has not been');
  s = s.replace(/\b(?:is|are|was|were)\s+has\s+been\b/gi, 'has been');
  s = s.replace(/\b(?:is|are|was|were)\s+has\b/gi, 'has');
  s = s.replace(/\b(my|the)\s+(?:dad|father|son|daughter|brother|sister|mom|mother)\b/gi, '$1 dog');
  s = s.replace(/\b(?:has\s+been\s+)+has\s+been\b/gi, 'has been');
  s = s.replace(/\b(?:has\s+)+has\b/gi, 'has');
  s = s.replace(/\bhas\s+had\s+had\b/gi, 'has had');
  s = s.replace(/\bhas\s+not\s+has\s+not\b/gi, 'has not');
  s = s.replace(/\bis\s+is\b/gi, 'is');
  s = s.replace(/\s{2,}/g, ' ').trim();

  // Ensure capitalization & period at end
  if (s.length > 0) {
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (!s.endsWith('.') && !s.endsWith('!') && !s.endsWith('?')) {
      s += '.';
    }
  }

  return s;
}

/**
 * React Hook for automatic, debounced English correction & clinical text refinement.
 * Automatically corrects grammar, spelling, punctuation, and shorthand.
 * Preserves cursor position, avoids interrupting typing, and ensures fields remain fully editable.
 */
export function useClinicalAutoRefine({
  value,
  onChange,
  fieldType = 'general',
  debounceMs = 1000,
  enabled = false,
  autoRefineOnType = false
}) {
  const [isRefining, setIsRefining] = useState(false);
  const [justRefined, setJustRefined] = useState(false);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const lastProcessedRef = useRef('');
  const latestValueRef = useRef(value);
  latestValueRef.current = value;

  const performRefinement = useCallback(async (textToRefine) => {
    if (!textToRefine) return;
    const trimmed = textToRefine.trim();
    if (trimmed.length < 4) return;
    if (trimmed === lastProcessedRef.current) return;

    setIsRefining(true);
    try {
      let refined = null;

      // 1. Try Backend AI Refinement Endpoint
      try {
        const res = await api.ai.refineText({ text: trimmed, fieldType });
        if (res && res.refinedText && res.refinedText.trim().length > 0) {
          refined = res.refinedText.trim();
        }
      } catch (err) {
        // Fall back to local clinical engine
      }

      // 2. Local intelligent clinical engine fallback
      if (!refined) {
        refined = localRefineClinicalText(trimmed, fieldType);
      }

      // 3. Apply if refined text is different from current trimmed input
      const currentVal = latestValueRef.current ? latestValueRef.current.trim() : '';
      if (currentVal === trimmed && refined && refined !== trimmed) {
        const element = inputRef.current;
        let nextCursorPos = null;

        if (element && document.activeElement === element) {
          const currentPos = element.selectionStart || 0;
          if (currentPos >= trimmed.length) {
            nextCursorPos = refined.length;
          } else {
            const ratio = currentPos / (trimmed.length || 1);
            nextCursorPos = Math.min(refined.length, Math.round(ratio * refined.length));
          }
        }

        lastProcessedRef.current = refined;
        if (element) {
          element.value = refined;
        }
        onChange(refined);
        setJustRefined(true);
        setTimeout(() => setJustRefined(false), 2500);

        if (element && nextCursorPos !== null) {
          requestAnimationFrame(() => {
            try {
              element.setSelectionRange(nextCursorPos, nextCursorPos);
            } catch (_) {}
          });
        }
      } else {
        lastProcessedRef.current = trimmed;
      }
    } finally {
      setIsRefining(false);
    }
  }, [fieldType, onChange]);

  // Typing handler - updates text immediately without interrupting user typing
  const handleTextChange = useCallback((newText) => {
    onChange(newText);
    if (!autoRefineOnType || !enabled) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performRefinement(newText);
    }, debounceMs);
  }, [onChange, enabled, autoRefineOnType, debounceMs, performRefinement]);

  // Manual blur handler (no automatic modification)
  const handleBlur = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // KeyDown handler
  const handleKeyDown = useCallback((e) => {
    // No automatic replacement on typing
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    inputRef,
    handleTextChange,
    handleBlur,
    handleKeyDown,
    isRefining,
    justRefined,
    refineNow: () => performRefinement(latestValueRef.current)
  };
}

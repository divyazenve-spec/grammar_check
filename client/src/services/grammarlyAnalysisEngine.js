/**
 * Zenve Vet™ — Grammarly-Style Clinical English Analysis Engine
 * 
 * Provides comprehensive real-time English linguistic analysis for veterinary
 * clinical narratives, chief complaints, and exam notes:
 * - Overall Writing Score (0 - 100)
 * - Correctness: Spelling, Subject-Verb Agreement, Punctuation, Capitalization
 * - Clarity & Conciseness: Medical phrasing, prepositional accuracy, redundancy
 * - Delivery & Formality: Objective clinical tone, professional veterinary terminology
 */

const VET_SPELLING_DICTIONARY = {
  'vomited': ['vomitted', 'vomitd', 'vomitting'],
  'vomiting': ['vomitting', 'vomting'],
  'diarrhea': ['diarrhoea', 'loose motion', 'loose motions', 'diarhea', 'dirhea', 'diarrea'],
  'anorexia': ['anorexic', 'anorexya'],
  'lethargic': ['lethargik', 'lethergic', 'letargic', 'dull and inactive'],
  'lethargy': ['lethergy', 'letargy'],
  'seizures': ['siezures', 'seisures', 'fits', 'convulsions'],
  'hematuria': ['blood in urine', 'bloody urine'],
  'hematochezia': ['blood in stool', 'blood in motion', 'bloody stool'],
  'dyspnea': ['diffculty breathing', 'breathlessness', 'hard breathing'],
  'pruritus': ['itching', 'itchy skin', 'scratching body'],
  'pyrexia': ['have fever', 'has fever', 'running fever'],
  'capillary refill time': ['crt time', 'capilary refill']
};

const NUM_WORDS = {
  '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
  '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten'
};

/**
 * Analyzes raw text and returns comprehensive Grammarly-style metrics & actionable issues.
 */
export function analyzeClinicalEnglish(rawText) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return {
      score: 100,
      scoreLabel: 'Ready to write',
      wordCount: 0,
      characterCount: 0,
      categories: {
        correctness: 0,
        clarity: 0,
        delivery: 0,
        engagement: 0
      },
      issues: [],
      refinedText: ''
    };
  }

  const text = rawText.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const issues = [];

  // ==========================================
  // 1. CORRECTNESS (Grammar, Spelling, Punctuation)
  // ==========================================

  // Missing initial article: "cat not eating" -> "The cat is not eating"
  const animalStartMatch = text.match(/^(cat|dog|puppy|kitten|horse|foal|cow|calf|bovine|equine|canine|feline|patient)\b/i);
  if (animalStartMatch) {
    const matched = animalStartMatch[0];
    issues.push({
      id: 'art-initial',
      category: 'correctness',
      categoryLabel: 'Missing Article',
      original: matched,
      replacement: `The ${matched.toLowerCase()}`,
      explanation: 'Add the definite article "The" to establish patient subject.',
      confidence: 0.95
    });
  }

  // Preposition error: "from yesterday" -> "since yesterday"
  const fromYesterdayMatches = [...text.matchAll(/\bfrom\s+yesterday\b/gi)];
  fromYesterdayMatches.forEach((m, idx) => {
    issues.push({
      id: `prep-yest-${idx}`,
      category: 'correctness',
      categoryLabel: 'Preposition Misuse',
      original: m[0],
      replacement: 'since yesterday',
      explanation: 'Use "since" with specific past starting points rather than "from".',
      confidence: 0.98
    });
  });

  // Preposition error: "from 2 days" -> "for two days"
  const fromDurationMatches = [...text.matchAll(/\b(?:from|since)\s+(\d+)\s*(days?|weeks?|months?|hours?)\b/gi)];
  fromDurationMatches.forEach((m, idx) => {
    const num = m[1];
    const unit = m[2].toLowerCase();
    const word = NUM_WORDS[num] || num;
    issues.push({
      id: `prep-dur-${idx}`,
      category: 'correctness',
      categoryLabel: 'Preposition & Duration',
      original: m[0],
      replacement: `for ${word} ${unit}`,
      explanation: `Use "for" with durations and write single numbers as words ("${word}").`,
      confidence: 0.96
    });
  });

  // Subject-verb agreement: "dog have fever", "patient have diarrhea"
  const haveFeverMatches = [...text.matchAll(/\b(?:have|has)\s+fever\b/gi)];
  haveFeverMatches.forEach((m, idx) => {
    issues.push({
      id: `fever-${idx}`,
      category: 'correctness',
      categoryLabel: 'Subject-Verb & Tense',
      original: m[0],
      replacement: 'has had a fever',
      explanation: 'Use "has had a fever" to denote ongoing clinical presentation.',
      confidence: 0.92
    });
  });

  // Inappetence & food intake phrasing
  const notEatingMatches = [...text.matchAll(/\b(?:not\s+taking\s+food(?:\s+properly)?|not\s+eating\s+properly|not\s+eating\s+food)\b/gi)];
  notEatingMatches.forEach((m, idx) => {
    issues.push({
      id: `appetite-${idx}`,
      category: 'clarity',
      categoryLabel: 'Clinical Phrasing',
      original: m[0],
      replacement: 'has not been eating properly',
      explanation: 'Use standard continuous clinical phrasing for appetite decline.',
      confidence: 0.94
    });
  });

  const simpleNotEat = [...text.matchAll(/\b(?:not\s+eating|not\s+eat)\b/gi)];
  simpleNotEat.forEach((m, idx) => {
    if (!text.toLowerCase().includes('not eating properly') && !text.toLowerCase().includes('not eating food')) {
      issues.push({
        id: `eat-simple-${idx}`,
        category: 'correctness',
        categoryLabel: 'Auxiliary Verb Missing',
        original: m[0],
        replacement: 'has not eaten',
        explanation: 'Add the auxiliary verb "has" to indicate present perfect state.',
        confidence: 0.9
      });
    }
  });

  // Missing auxiliary verb before continuous verbs: "not sleeping", "not walking", etc.
  const sleepDurationMatches = [...text.matchAll(/(?<!\b(?:has\s+been|have\s+been)\s+)\b(?:is\s+)?not\s+(?:sleeping|sleep)\s+(since\s+yesterday|since\s+this\s+morning|since\s+last\s+night|for\s+\w+\s+days?|for\s+\d+\s+days?)\b/gi)];
  sleepDurationMatches.forEach((m, idx) => {
    issues.push({
      id: `sleep-dur-${idx}`,
      category: 'correctness',
      categoryLabel: 'Tense & Duration',
      original: m[0],
      replacement: `has not been sleeping ${m[1]}`,
      explanation: 'Use present perfect continuous "has not been sleeping" with duration or starting timeframes.',
      confidence: 0.96
    });
  });

  const sleepMatches = [...text.matchAll(/(?<!\b(?:is|are|was|were|has\s+been|have\s+been|can|could|will|would|does|do|did)\s+)\bnot\s+sleeping\b/gi)];
  sleepMatches.forEach((m, idx) => {
    if (!sleepDurationMatches.some(sd => sd[0].toLowerCase().includes(m[0].toLowerCase()))) {
      issues.push({
        id: `aux-sleep-${idx}`,
        category: 'correctness',
        categoryLabel: 'Missing Auxiliary Verb',
        original: m[0],
        replacement: 'is not sleeping',
        explanation: 'Add the auxiliary verb "is" to complete the continuous tense ("is not sleeping").',
        confidence: 0.98
      });
    }
  });

  const sleepBaseMatches = [...text.matchAll(/(?<!\b(?:is|are|was|were|has\s+been|have\s+been|can|could|will|would|does|do|did)\s+)\bnot\s+sleep\b/gi)];
  sleepBaseMatches.forEach((m, idx) => {
    if (!sleepDurationMatches.some(sd => sd[0].toLowerCase().includes(m[0].toLowerCase()))) {
      issues.push({
        id: `aux-sleep-base-${idx}`,
        category: 'correctness',
        categoryLabel: 'Verb Form & Tense',
        original: m[0],
        replacement: 'is not sleeping',
        explanation: 'Use continuous clinical tense "is not sleeping" to describe ongoing state.',
        confidence: 0.95
      });
    }
  });

  // Other continuous clinical verbs missing auxiliary verbs: "not walking", "not drinking", "not moving", etc.
  const commonContinuousVerbs = [
    { verb: 'walking', fix: 'is not walking' },
    { verb: 'moving', fix: 'is not moving' },
    { verb: 'standing', fix: 'is not standing' },
    { verb: 'responding', fix: 'is not responding' },
    { verb: 'drinking water', fix: 'has not been drinking water' },
    { verb: 'drinking', fix: 'is not drinking' },
    { verb: 'urinating', fix: 'is not urinating' },
    { verb: 'peeing', fix: 'is not urinating' },
    { verb: 'defecating', fix: 'is not defecating' },
    { verb: 'pooping', fix: 'is not defecating' },
    { verb: 'resting', fix: 'is not resting' },
    { verb: 'barking', fix: 'is not barking' },
    { verb: 'meowing', fix: 'is not meowing' },
    { verb: 'playing', fix: 'is not playing' },
    { verb: 'breathing properly', fix: 'is not breathing properly' }
  ];

  commonContinuousVerbs.forEach(({ verb, fix }, idx) => {
    const pattern = new RegExp(`(?<!\\b(?:is|are|was|were|has\\s+been|have\\s+been|can|could|will|would|does|do|did)\\s+)\\bnot\\s+${verb}\\b`, 'gi');
    const matches = [...text.matchAll(pattern)];
    matches.forEach((m, mIdx) => {
      issues.push({
        id: `aux-cont-${idx}-${mIdx}`,
        category: 'correctness',
        categoryLabel: 'Missing Auxiliary Verb',
        original: m[0],
        replacement: fix,
        explanation: `Add appropriate auxiliary verb to form "${fix}".`,
        confidence: 0.95
      });
    });
  });

  // Emesis / Vomiting expressions
  const vomitDurationMatches = [...text.matchAll(/(?<!\b(?:has\s+been|have\s+been)\s+)\b(?:has\s+)?vomit(?:ed|ing)?\s+(since\s+yesterday|since\s+this\s+morning|since\s+last\s+night|for\s+\w+\s+days?|for\s+\d+\s+days?)\b/gi)];
  vomitDurationMatches.forEach((m, idx) => {
    issues.push({
      id: `vomit-dur-${idx}`,
      category: 'correctness',
      categoryLabel: 'Tense & Duration',
      original: m[0],
      replacement: `has been vomiting ${m[1]}`,
      explanation: 'Use present perfect continuous "has been vomiting" with duration or starting timeframes.',
      confidence: 0.97
    });
  });

  const vomitSubjMatches = [...text.matchAll(/\b(?:the\s+)?(cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal|he|she|it)\s+vomit\b(?!(?:ed|ing|\s+times?|\s+since|\s+for|\s+sample|\s+color|\s+bowl))/gi)];
  vomitSubjMatches.forEach((m, idx) => {
    issues.push({
      id: `vomit-subj-${idx}`,
      category: 'correctness',
      categoryLabel: 'Subject-Verb & Tense',
      original: 'vomit',
      replacement: 'has vomited',
      explanation: 'Use present perfect "has vomited" for third-person singular patient emesis.',
      confidence: 0.98
    });
  });

  const vomitingSubjMatches = [...text.matchAll(/(?<!\b(?:is|are|was|were|has\s+been|have\s+been)\s+)\b(?:the\s+)?(cat|dog|puppy|kitten|horse|foal|cow|calf|patient|animal|he|she|it)\s+vomiting\b/gi)];
  vomitingSubjMatches.forEach((m, idx) => {
    issues.push({
      id: `vomiting-aux-${idx}`,
      category: 'correctness',
      categoryLabel: 'Missing Auxiliary Verb',
      original: 'vomiting',
      replacement: 'is vomiting',
      explanation: 'Add auxiliary verb "is" for present continuous emesis ("is vomiting").',
      confidence: 0.97
    });
  });

  // Vomit frequency: "vomit 3 times" -> "has vomited three times"
  const vomitTimes = [...text.matchAll(/\b(?:and\s+)?vomit(?:ed|ing)?\s+(\d+)\s+times?\b/gi)];
  vomitTimes.forEach((m, idx) => {
    const num = m[1];
    const word = NUM_WORDS[num] || num;
    issues.push({
      id: `vomit-times-${idx}`,
      category: 'clarity',
      categoryLabel: 'Clinical Clarity',
      original: m[0],
      replacement: `and has vomited ${word} times`,
      explanation: `Specify precise clinical emesis frequency ("has vomited ${word} times").`,
      confidence: 0.97
    });
  });

  // Single / twice vomiting
  const vomitOnce = [...text.matchAll(/\b(?:and\s+)?vomit(?:ed|ing)?\s+1\s+times?\b/gi)];
  vomitOnce.forEach((m, idx) => {
    issues.push({
      id: `vomit-once-${idx}`,
      category: 'delivery',
      categoryLabel: 'Natural Expression',
      original: m[0],
      replacement: 'and has vomited once',
      explanation: 'Use "once" instead of "1 times".',
      confidence: 0.99
    });
  });

  // ==========================================
  // 2. DELIVERY & MEDICAL TERMINOLOGY (Formal Tone)
  // ==========================================

  // "loose motion" -> "diarrhea"
  const looseMotionMatches = [...text.matchAll(/\bloose\s+motions?\b/gi)];
  looseMotionMatches.forEach((m, idx) => {
    issues.push({
      id: `loose-motion-${idx}`,
      category: 'delivery',
      categoryLabel: 'Veterinary Terminology',
      original: m[0],
      replacement: 'diarrhea',
      explanation: 'Replace colloquial "loose motion" with clinical term "diarrhea".',
      confidence: 0.99
    });
  });

  // "blood in motion" / "blood in stool" -> "hematochezia" / "blood in the stool"
  const bloodStoolMatches = [...text.matchAll(/\bblood\s+in\s+(?:motion|stool)\b/gi)];
  bloodStoolMatches.forEach((m, idx) => {
    issues.push({
      id: `blood-stool-${idx}`,
      category: 'delivery',
      categoryLabel: 'Clinical Terminology',
      original: m[0],
      replacement: 'blood in the stool',
      explanation: 'Use formal clinical terminology "blood in the stool".',
      confidence: 0.95
    });
  });

  // Common spelling typos
  const spellingChecks = [
    { regex: /\bvomitted\b/gi, fix: 'vomited', label: 'Spelling' },
    { regex: /\bvomitting\b/gi, fix: 'vomiting', label: 'Spelling' },
    { regex: /\bdiarhea\b/gi, fix: 'diarrhea', label: 'Spelling' },
    { regex: /\blethergic\b/gi, fix: 'lethargic', label: 'Spelling' },
    { regex: /\blethergy\b/gi, fix: 'lethargy', label: 'Spelling' },
    { regex: /\banorexya\b/gi, fix: 'anorexia', label: 'Spelling' },
    { regex: /\bsiezures?\b/gi, fix: 'seizures', label: 'Spelling' },
    { regex: /\bseisure\b/gi, fix: 'seizure', label: 'Spelling' }
  ];

  spellingChecks.forEach((check, idx) => {
    const matches = [...text.matchAll(check.regex)];
    matches.forEach((m, mIdx) => {
      issues.push({
        id: `spell-${idx}-${mIdx}`,
        category: 'correctness',
        categoryLabel: check.label,
        original: m[0],
        replacement: check.fix,
        explanation: `Correct spelling of "${m[0]}" to "${check.fix}".`,
        confidence: 0.99
      });
    });
  });

  // Punctuation & sentence termination
  if (wordCount >= 3 && !/[.!?]$/.test(text)) {
    issues.push({
      id: 'punct-end',
      category: 'correctness',
      categoryLabel: 'Punctuation',
      original: '[end of sentence]',
      replacement: '.',
      explanation: 'Add closing period to complete the clinical sentence.',
      confidence: 0.9
    });
  }

  // Deduplicate issues by original string
  const uniqueIssues = [];
  const seenOriginals = new Set();
  for (const issue of issues) {
    const key = `${issue.original.toLowerCase()}->${issue.replacement.toLowerCase()}`;
    if (!seenOriginals.has(key)) {
      seenOriginals.add(key);
      uniqueIssues.push(issue);
    }
  }

  // Category counts
  const categories = {
    correctness: uniqueIssues.filter(i => i.category === 'correctness').length,
    clarity: uniqueIssues.filter(i => i.category === 'clarity').length,
    delivery: uniqueIssues.filter(i => i.category === 'delivery').length,
    engagement: uniqueIssues.filter(i => i.category === 'engagement').length
  };

  // Calculate Grammarly Overall Writing Score (0 - 100)
  const totalDeductions = (categories.correctness * 12) + (categories.clarity * 8) + (categories.delivery * 6);
  const score = Math.max(45, Math.min(100, 100 - totalDeductions));

  let scoreLabel = 'Excellent';
  if (score < 70) scoreLabel = 'Needs Review';
  else if (score < 85) scoreLabel = 'Good';
  else if (score < 95) scoreLabel = 'Very Clear';

  // Compute full refined text preview by applying all replacements
  const refinedText = applyAllIssuesToText(rawText, uniqueIssues);

  return {
    score,
    scoreLabel,
    wordCount,
    characterCount: rawText.length,
    categories,
    issues: uniqueIssues,
    refinedText
  };
}

/**
 * Applies a specific Grammarly issue to raw text.
 */
export function applySingleIssue(rawText, issue) {
  if (!rawText || !issue) return rawText;

  if (issue.id === 'punct-end') {
    return rawText.trim().replace(/[.!?]*$/, '.');
  }

  if (issue.id === 'art-initial') {
    return rawText.replace(new RegExp(`^${issue.original}\\b`, 'i'), issue.replacement);
  }

  // Use case-insensitive exact boundary replacement
  const escaped = issue.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  if (regex.test(rawText)) {
    return rawText.replace(regex, issue.replacement);
  }
  // Fallback to literal replace
  return rawText.replace(issue.original, issue.replacement);
}

/**
 * Applies all detected Grammarly issues to transform text into professional clinical English.
 */
export function applyAllIssuesToText(rawText, issues) {
  if (!rawText) return '';
  if (!issues || issues.length === 0) return rawText;

  let result = rawText;
  for (const issue of issues) {
    if (issue.id === 'punct-end') {
      continue; // Handled at final step
    } else if (issue.id === 'art-initial') {
      result = result.replace(new RegExp(`^${issue.original}\\b`, 'i'), issue.replacement);
    } else {
      const escaped = issue.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      result = result.replace(regex, issue.replacement);
    }
  }

  // Capitalize initial character
  result = result.trim();
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
    if (!/[.!?]$/.test(result)) {
      result += '.';
    }
  }

  // Clean double spaces
  result = result.replace(/\s{2,}/g, ' ');

  return result;
}

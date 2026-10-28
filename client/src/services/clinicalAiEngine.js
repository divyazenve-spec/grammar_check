/**
 * ZENVE VET™ — Client-Side Intelligent Clinical AI Engine
 * 
 * Provides instantaneous real-time multi-specialty differential diagnosis,
 * clinical synthesis, diagnostics, and emergency protocols matching
 * the backend veterinary AI intelligence.
 */

function containsAnyWord(text, ...keywords) {
  if (!text || keywords.length === 0) return false;
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${escaped})\\b`, 'i');
  return regex.test(text);
}

export function analyzeClinicalCaseLocally(species = 'Canine', rawSymptoms = '', rawVitals = '') {
  const sp = species || 'Canine';
  const sym = (rawSymptoms || '').toLowerCase();
  const vit = (rawVitals || '').toLowerCase();
  const combined = `${sym} ${vit}`.toLowerCase();
  const isAvian = sp.toLowerCase().includes('avian') || sp.toLowerCase().includes('bird') || sp.toLowerCase().includes('exotic') || containsAnyWord(combined, 'bird', 'parrot', 'cockatiel', 'budgie', 'canary', 'feather', 'beak', 'crop', 'wing', 'avian', 'perch');
  const isBovine = sp.toLowerCase().includes('bovine') || sp.toLowerCase().includes('cow') || sp.toLowerCase().includes('calf') || sp.toLowerCase().includes('cattle') || containsAnyWord(combined, 'cow', 'calf', 'heifer', 'bull', 'bovine', 'rumen', 'udder', 'mastitis', 'bloat', 'milk fever', 'downer');
  const isEquine = sp.toLowerCase().includes('equine') || sp.toLowerCase().includes('horse') || sp.toLowerCase().includes('foal') || containsAnyWord(combined, 'horse', 'mare', 'stallion', 'foal', 'equine', 'colic', 'laminitis', 'founder', 'choke', 'thrush', 'hoof', 'heaves');

  // =========================================================================
  // 0A. AVIAN / EXOTIC: EGG BINDING & COELOMIC OBSTETRIC DISTRESS
  // =========================================================================
  if (isAvian && containsAnyWord(combined, 'egg', 'egg bound', 'egg binding', 'swollen vent', 'vent', 'cloaca', 'straining at bottom', 'bottom of cage', 'tail pumping', 'soft egg')) {
    return {
      clinicalSummary: `The patient (${sp}) presents with critical coelomic distension, tenesmus, and suspected post-ovulatory dystocia (egg binding). Calcium exhaustion, hypothermia, and compression of pelvic renal nerves risk fatal circulatory collapse.`,
      primaryDifferentials: [
        { name: "Acute Obstructive Egg Binding / Post-Ovulatory Dystocia", likelihood: "High (90%)", reasoning: `Visible/palpable caudal coelomic mass, wide-based stance, and straining at bottom of cage in ${sp}.` },
        { name: "Cloacal / Oviductal Prolapse secondary to Tenesmus", likelihood: "Moderate (60%)", reasoning: "Everted hyperemic cloacal or uterine mucosa with persistent expulsive efforts." },
        { name: "Egg Yolk Coelomitis / Salpingitis", likelihood: "Moderate (45%)", reasoning: "Rupture of ectopic yolk triggering non-septic or septic coelomic inflammation." }
      ],
      recommendedDiagnostics: [
        "Whole-body orthogonal survey digital radiography (low kVp technique to assess egg calcification and pelvic canal alignment)",
        "Point-of-care ionized calcium (iCa) and blood glucose evaluation",
        "Gentle coelomic ultrasonography to inspect oviductal wall integrity and fluid accumulation",
        "Cloacal swab cytology and Gram stain"
      ],
      emergencyActionProtocol: [
        "Place patient immediately in a heated, humidified incubator (85-90°F / 29-32°C, 70% relative humidity).",
        "Administer 10% Calcium gluconate (50-100 mg/kg IM) and supportive warm SQ fluids (LRS with 2.5% Dextrose).",
        "Provide analgesia: Butorphanol (1-2 mg/kg IM) or Meloxicam (1 mg/kg IM/PO).",
        "Apply topical sterile water-soluble lubrication to cloacal sphincter; if dystocia persists, prepare for transcloacal ovocentesis or microsurgical salpingotomy."
      ]
    };
  }

  // =========================================================================
  // 0B. AVIAN / EXOTIC: CROP STASIS, SOUR CROP & REGURGITATION
  // =========================================================================
  if (isAvian && containsAnyWord(combined, 'crop', 'sour crop', 'crop stasis', 'regurgitat', 'vomit seed', 'seeds regurgitat', 'pendulous crop', 'crop swollen', 'crop fluid')) {
    return {
      clinicalSummary: `The patient (${sp}) exhibits severe upper gastrointestinal stasis with ingluvial fluid accumulation (sour crop). Secondary fermentation, mucosal fungal overgrowth, and fatal regurgitation aspiration are significant risks.`,
      primaryDifferentials: [
        { name: "Ingluvial Candidiasis (Sour Crop / Candida albicans)", likelihood: "High (85%)", reasoning: `Delayed crop emptying, thickened crop mucosa, regurgitation of mucus and foul sour odor in ${sp}.` },
        { name: "Bacterial Ingluvitis / Trichomoniasis (Canker)", likelihood: "Moderate (60%)", reasoning: "Caseous crop exudate, foul breath, and flagellated protozoal colonization." },
        { name: "Foreign Body Crop Impaction or Heavy Metal Toxicosis", likelihood: "Moderate (45%)", reasoning: "Mechanical obstruction or systemic zinc/lead ingestion halting gastrointestinal motility." }
      ],
      recommendedDiagnostics: [
        "Direct crop aspirate wet mount microscopy and Gram stain (quantify budding yeast and pseudohyphae)",
        "Survey whole-body radiographs to inspect for radiopaque metallic density in crop/ventriculus",
        "Crop flush cytology and fungal/bacterial culture with antimicrobial susceptibility",
        "Plasma biochemistry (Bile acids, AST, Uric acid)"
      ],
      emergencyActionProtocol: [
        "Gently decompress and evacuate fermenting crop contents via soft red rubber feeding tube under light manual restraint.",
        "Perform crop lavage with warm sterile isotonic saline.",
        "Administer oral antifungal: Nystatin (300,000 IU/kg PO q12h) or Fluconazole (15 mg/kg PO q24h).",
        "Administer prokinetic (Metoclopramide 0.5 mg/kg PO/IM) once physical obstruction is radiographically ruled out."
      ]
    };
  }

  // =========================================================================
  // 0C. AVIAN / EXOTIC: FEATHER PLUCKING, SCALY FACE MITES & BEAK OVERGROWTH
  // =========================================================================
  if (isAvian && containsAnyWord(combined, 'feather', 'plucking', 'bare chest', 'picking feather', 'scaly face', 'crusty beak', 'beak', 'mite', 'mites', 'chewing wing', 'blood feather')) {
    return {
      clinicalSummary: `The patient (${sp}) displays cutaneous irritation, abnormal plumage loss, or beak hyperkeratosis. Systematic differentiation between parasitic acariasis, environmental malnutrition, and viral folliculotropic disease is indicated.`,
      primaryDifferentials: [
        { name: "Knemidocoptes pilae Acariasis (Scaly Face & Beak Mite)", likelihood: "High (80%)", reasoning: `Honeycomb-like crusting on cere, beak rhamphotheca, and periocular skin in ${sp}.` },
        { name: "Psychogenic / Environmental Feather-Damaging Behavior", likelihood: "Moderate (65%)", reasoning: "Symmetrical down and contour feather removal over breast and thighs with head feathers intact." },
        { name: "Psittacine Beak and Feather Disease (Circovirus / PBFD)", likelihood: "Moderate (40%)", reasoning: "Dystrophic feather shafts, retained feather sheaths, and progressive beak necrosis." }
      ],
      recommendedDiagnostics: [
        "Microscopic mineral oil skin and beak scrape examination to confirm Knemidocoptes mites",
        "PBFD (Circovirus) and Polyomavirus blood PCR testing",
        "Gram stain and fungal culture of newly plucked growing feather pulps",
        "Plasma liver profile (AST, Bile acids) to evaluate underlying hepatic pruritus"
      ],
      emergencyActionProtocol: [
        "For confirmed or suspected mites: Apply Ivermectin (0.2 mg/kg spot-on or IM) repeat at 14-day intervals.",
        "If active bleeding from a broken blood feather: Grasp base firmly with hemostat and pull cleanly in direction of growth, then apply direct digital pressure.",
        "Introduce soft fabric Elizabethan collar only if active self-mutilation or severe skin laceration is occurring.",
        "Transition diet from nutrient-poor all-seed blends to balanced extruded pellets supplemented with fresh vegetables."
      ]
    };
  }

  // =========================================================================
  // 0D. AVIAN / EXOTIC: RESPIRATORY DISTRESS & TAIL BOBBING
  // =========================================================================
  if (isAvian && containsAnyWord(combined, 'tail bob', 'tail bobbing', 'clicking', 'open mouth', 'gasping', 'puffed', 'respiratory', 'breathing hard', 'voice change')) {
    return {
      clinicalSummary: `The patient (${sp}) presents in critical avian respiratory failure characterized by conspicuous tail bobbing and compensatory open-mouth breathing. Because avian respiration relies entirely on active thoracic expansion, handling must be minimal to prevent arrest.`,
      primaryDifferentials: [
        { name: "Air Sacculitis / Pulmonary Aspergillosis (Aspergillus fumigatus)", likelihood: "High (80%)", reasoning: `Inspiratory dyspnea with rhythmic tail bobbing, vocal change, and air sac clouding in ${sp}.` },
        { name: "Avian Chlamydiosis (Chlamydia psittaci / Psittacosis)", likelihood: "Moderate (65%)", reasoning: "Conjunctivitis, bilateral nasal discharge, bright green urates, and respiratory distress." },
        { name: "Inhaled Toxin / Polytetrafluoroethylene (PTFE / Teflon) Toxicosis", likelihood: "Moderate (45%)", reasoning: "Acute pulmonary edema and hemorrhage following exposure to overheated non-stick cookware." }
      ],
      recommendedDiagnostics: [
        "Whole-body orthogonal radiographs (performed only after initial oxygen stabilization) to inspect air sac volume and parabronchial pattern",
        "Choanal and cloacal swab PCR for Chlamydia psittaci",
        "Complete CBC (marked leukocytosis with heterophilia and toxic granulation suggests mycotic granuloma)",
        "Tracheal swab cytology and fungal culture"
      ],
      emergencyActionProtocol: [
        "Place immediately into a quiet, warm (28-30°C) oxygen chamber (40-50% FiO2) with ZERO initial handling.",
        "DO NOT compress the patient's keel or thoracic cage during any emergency procedures.",
        "Nebulize with sterile saline combined with F10 veterinary antiseptic solution (1:250) or Amphotericin B.",
        "Initiate Doxycycline therapy (25-50 mg/kg PO or IM q7d) if Chlamydiosis cannot be excluded."
      ]
    };
  }

  // =========================================================================
  // 0E. BOVINE: ACUTE MASTITIS & UDDER PATHOLOGY
  // =========================================================================
  if (isBovine && containsAnyWord(combined, 'mastitis', 'clots in milk', 'clot in milk', 'udder', 'quarter', 'watery milk', 'bloody milk', 'hot quarter', 'swollen quarter', 'hard quarter')) {
    return {
      clinicalSummary: `The patient (${sp}) presents with acute localized or toxic parenchymal mammary gland inflammation (mastitis). Immediate intervention is required to prevent systemic endotoxemic bacteremia, secretory alveolar destruction, or septic recumbency.`,
      primaryDifferentials: [
        { name: "Acute Coliform Mastitis (Escherichia coli / Klebsiella endotoxemia)", likelihood: "High (85%)", reasoning: `Hard, swollen quarter with serous/watery secretion, milk clots, fever, and dehydration in ${sp}.` },
        { name: "Contagious Clinical Mastitis (Staphylococcus aureus / Streptococcus agalactiae)", likelihood: "Moderate (60%)", reasoning: "Persistent quarter induration, microabscesses, and elevated bulk somatic cell count." },
        { name: "Mycoplasma bovis Mammary Infection", likelihood: "Moderate (40%)", reasoning: "Multi-quarter involvement with tan sediment, resistant to beta-lactam antibiotics." }
      ],
      recommendedDiagnostics: [
        "California Mastitis Test (CMT) score determination across all four quarters",
        "Aseptic milk sampling of affected quarter for microbiological culture and antibiotic sensitivity testing",
        "Point-of-care systemic hydration and venous blood gas / lactate assessment for endotoxemia triage",
        "Serum ionized calcium and blood beta-hydroxybutyrate (BHB) concentration"
      ],
      emergencyActionProtocol: [
        "Perform frequent manual quarter strip-outs (every 2-3 hours) to physically evacuate bacteria and destructive endotoxins.",
        "Administer systemic NSAID: Flunixin meglumine (2.2 mg/kg slow IV) to neutralize endotoxin cascade.",
        "Infuse intramammary broad-spectrum approved antimicrobial suspension following complete teat disinfection.",
        "For toxic endotoxemic mastitis: Resuscitate with IV hypertonic saline (7.2% NaCl 4-5 mL/kg IV over 20 min) followed immediately by free access to fresh water."
      ]
    };
  }

  // =========================================================================
  // 0F. BOVINE: FOOT ROT & HOOF LAMENESS
  // =========================================================================
  if (isBovine && containsAnyWord(combined, 'foot rot', 'hoof', 'lame', 'lameness', 'interdigital', 'foul smell', 'swollen foot', 'coronary band', 'sole ulcer')) {
    return {
      clinicalSummary: `The patient (${sp}) exhibits severe pelvic or thoracic limb lameness with localized podal inflammation. Rapid debridement and targeted systemic antimicrobials are necessary to prevent deep sepsis of the distal interphalangeal joint.`,
      primaryDifferentials: [
        { name: "Interdigital Phlegmon (Bovine Foot Rot / Fusobacterium necrophorum)", likelihood: "High (85%)", reasoning: `Symmetrical interdigital swelling, painful fissure with characteristic foul necrotic odor in ${sp}.` },
        { name: "Contagious Digital Dermatitis (Strawberry Foot Rot / Treponema)", likelihood: "Moderate (65%)", reasoning: "Erythematous, papillomatous, highly sensitive strawberry-like erosions near the heel bulb." },
        { name: "Subsolar Abscess / Rusterholz Sole Ulcer", likelihood: "Moderate (45%)", reasoning: "Focal weight-bearing pain, sole defect at the sole-bulb junction requiring hoof paring." }
      ],
      recommendedDiagnostics: [
        "Restraint in hoof trimming chute with thorough hoof washing and visual interdigital cleft inspection",
        "Hoof tester examination to isolate localized subsolar or wall pressure sensitivity",
        "Deep exploration and debridement of necrotic fissures to assess navicular bursa involvement",
        "Contralateral foot comparison"
      ],
      emergencyActionProtocol: [
        "Thoroughly cleanse and mechanically debride all necrotic debris from interdigital space.",
        "Administer systemic antimicrobial: Long-acting Oxytetracycline (20 mg/kg SQ/IM) or Ceftiofur crystalline free acid.",
        "Apply topical antiseptic dressing (Copper sulfate or Oxytetracycline powder) with protective non-constrictive bandage for 48 hours.",
        "Relocate cow to clean, dry, well-bedded loafing area; apply wooden or polyurethane orthotic block to healthy claw if sole ulcer present."
      ]
    };
  }

  // =========================================================================
  // 0G. BOVINE: CALF SCOURS & NEONATAL DIARRHEA
  // =========================================================================
  if (isBovine && containsAnyWord(combined, 'calf scours', 'calf diarrhea', 'scour', 'white diarrhea', 'yellow diarrhea', 'sunken eyes', 'weak calf', 'cold ears')) {
    return {
      clinicalSummary: `The patient (${sp}) presents with severe acute neonatal enteritis (calf scours), profound dehydration, and systemic metabolic acidosis. Immediate correction of strong-ion base deficit and fluid volume deficit is lifesaving.`,
      primaryDifferentials: [
        { name: "Neonatal Viral Enteritis (Bovine Rotavirus / Coronavirus)", likelihood: "High (80%)", reasoning: `Profuse watery yellow-green diarrhea, mucosal villous blunting, and rapid dehydration in ${sp}.` },
        { name: "Cryptosporidiosis (Cryptosporidium parvum)", likelihood: "Moderate (70%)", reasoning: "Persistent watery diarrhea refractory to standard antibacterial treatments." },
        { name: "Enterotoxigenic Escherichia coli (ETEC / K99 Antigen)", likelihood: "Moderate (55%)", reasoning: "Hypersecretory watery scours in calves under 5 days of age with severe endotoxemic shock." }
      ],
      recommendedDiagnostics: [
        "Fecal rapid antigen multiplex strip (Rotavirus, Coronavirus, Cryptosporidium, E. coli K99)",
        "Venous blood gas or total CO2 / base excess to quantify severe metabolic acidosis",
        "Refractometer total serum protein (assess failure of passive colostral transfer / IgG < 5.5 g/dL)",
        "Blood glucose and serum electrolyte panel (evaluate hyperkalemia / hyponatremia)"
      ],
      emergencyActionProtocol: [
        "For recumbent calf with >8% dehydration and absent suckle reflex: Place IV catheter and infuse isotonic Sodium Bicarbonate (1.3%) or LRS with added NaHCO3.",
        "For standing calf with intact suckle: Administer 2 Liters of high-alkalizing oral electrolyte solution (OES) containing acetate/propionate.",
        "DO NOT withhold milk feeding; alternate milk with oral electrolytes 2 hours apart to sustain intestinal mucosa.",
        "Provide broad-spectrum parenteral antibiotic (Amoxicillin or Florfenicol) if calf is pyrexic or bacteremic."
      ]
    };
  }

  // =========================================================================
  // 0H. EQUINE: ACUTE LAMINITIS / FOUNDER
  // =========================================================================
  if (isEquine && containsAnyWord(combined, 'laminitis', 'founder', 'rocking back', 'bounding pulse', 'digital pulse', 'heat in hoof', 'heat in feet', 'hot hoof', 'coffin bone', 'sinking sole')) {
    return {
      clinicalSummary: `The patient (${sp}) presents in acute, excruciating digital laminitis with impending or active degradation of the laminar suspensory apparatus. Urgent continuous cryotherapy, mechanical frog support, and anti-inflammatory therapy are paramount to prevent distal phalanx rotation.`,
      primaryDifferentials: [
        { name: "Endocrinopathic Laminitis (Equine Metabolic Syndrome / PPID)", likelihood: "High (85%)", reasoning: `Classic rocked-back posture on heels, pounding digital pulses, and solar heat in ${sp}.` },
        { name: "Sepsis-Related Laminitis (Systemic Inflammatory Response / Colitis / Endotoxemia)", likelihood: "Moderate (65%)", reasoning: "Secondary laminar enzymatic destruction following acute systemic endotoxic illness." },
        { name: "Supporting-Limb Laminitis (Excessive Weight Overload)", likelihood: "Moderate (40%)", reasoning: "Mechanical hypoperfusion in contralateral foot due to severe unilateral musculoskeletal injury." }
      ],
      recommendedDiagnostics: [
        "Orthogonal digital radiographs of both front feet (horizontal-beam lateromedial view with radio-opaque dorsal wall marker to calculate rotation and founder distance)",
        "Digital arterial palpation and caliper assessment of coronary band depression / sinking",
        "Dynamic endocrine screening: Resting baseline serum insulin, leptin, and TRH stimulation test for ACTH",
        "Careful hoof tester examination to map focal subsolar hyperpathia"
      ],
      emergencyActionProtocol: [
        "Initiate continuous distal limb cryotherapy immediately: Submerge distal limbs in ice-water slurry up to carpi/tarsi for 48-72 hours continuously.",
        "House in deep sand or sawdust bedding (minimum 18 inches) to distribute solar weight evenly.",
        "Apply soft support boots (Soft-Ride) or adhesive Styrofoam frog pads to reduce deep digital flexor tendon pull.",
        "Administer Flunixin meglumine (1.1 mg/kg IV/PO q12h) and Pentoxifylline; enforce STRICT stall rest (do NOT walk the horse)."
      ]
    };
  }

  // =========================================================================
  // 0I. EQUINE: ESOPHAGEAL OBSTRUCTION (CHOKE)
  // =========================================================================
  if (isEquine && containsAnyWord(combined, 'choke', 'saliva from nose', 'feed from nose', 'feed from nostril', 'green discharge nostril', 'stretched neck', 'coughing feed', 'esophagus')) {
    return {
      clinicalSummary: `The patient (${sp}) displays acute esophageal foreign body or feedstuff impaction (choke). Secondary complications include severe mucosal pressure necrosis, stricture formation, and fatal aspiration pneumonia.`,
      primaryDifferentials: [
        { name: "Acute Primary Esophageal Food Impaction (Pelleted Feed / Beet Pulp / Hay)", likelihood: "High (90%)", reasoning: `Profuse bilateral green nasal discharge containing saliva and food particles, outstretched neck, and retching in ${sp}.` },
        { name: "Secondary Esophageal Diverticulum or Chronic Stricture", likelihood: "Moderate (50%)", reasoning: "Recurrent choke episodes with anatomical structural esophageal luminal narrowing." },
        { name: "Pharyngeal Foreign Body or Retropharyngeal Abscess", likelihood: "Moderate (35%)", reasoning: "Mechanical upper airway compression and severe dysphagia." }
      ],
      recommendedDiagnostics: [
        "Gentle diagnostic passage of lubricated small-bore nasogastric tube to identify obstruction distance",
        "Upper respiratory and esophageal videoendoscopy to evaluate mucosal ulceration or perforation risk",
        "Thoracic auscultation and orthogonal radiographs to screen for secondary aspiration pneumonia",
        "Complete CBC and serum fibrinogen to monitor infectious inflammatory response"
      ],
      emergencyActionProtocol: [
        "Withhold all access to feed, water, and bedding immediately.",
        "Sedate horse with an alpha-2 agonist (Detomidine 0.01 mg/kg IV or Xylazine 0.5 mg/kg IV) combined with Butorphanol to lower the head below carpi level.",
        "Administer Buscopan (N-butylscopolammonium bromide 0.3 mg/kg IV) or Oxytocin to relax esophageal musculature.",
        "Pass nasogastric tube gently and lavage with warm water; keep horse's head lowered to prevent aspiration until the obstruction dissolves."
      ]
    };
  }

  // =========================================================================
  // 0J. DENTAL & PERIODONTAL PATHOLOGY (ALL SPECIES)
  // =========================================================================
  if (containsAnyWord(combined, 'dental', 'teeth', 'tooth', 'bad breath', 'halitosis', 'tartar', 'calculus', 'bleeding gums', 'gingivitis', 'tooth root', 'carnassial', 'drooling food', 'stomatitis')) {
    return {
      clinicalSummary: `The patient (${sp}) presents with advanced oral or periodontal disease characterized by heavy calculus, gingival inflammation, or tooth root compromise. Comprehensive staging under general anesthesia is required to eliminate chronic bacterial nidus and pain.`,
      primaryDifferentials: [
        { name: "Stage III-IV Periodontal Disease with Furcation Exposure", likelihood: "High (85%)", reasoning: `Severe dental calculus, halitosis, gingival recession, and tooth mobility in ${sp}.` },
        { name: "Tooth Root Abscess (Maxillary Carnassial / Premolar 4)", likelihood: "Moderate (65%)", reasoning: "Facial swelling, infraorbital draining tract, and unilateral localized maxillary tenderness." },
        { name: "Feline Chronic Gingivostomatitis (FCGS) / Tooth Resorption (TR)", likelihood: "Moderate (55%)", reasoning: "Severe caudal mucositis, cobblestone oral erythema, and subgingival tooth resorption." }
      ],
      recommendedDiagnostics: [
        "Full-mouth intraoral digital dental radiography under general anesthesia to evaluate alveolar bone loss and root resorption",
        "Periodontal probing and charting of all 42 teeth (dog) / 30 teeth (cat) to measure pocket depths",
        "Pre-anesthetic complete blood count and biochemical renal/hepatic evaluation",
        "Oral biopsy and histopathology if asymmetric proliferative mucosal masses are identified"
      ],
      emergencyActionProtocol: [
        "Perform thorough supragingival and subgingival ultrasonic scaling followed by polish with fine fluoride paste.",
        "Perform surgical extraction of non-viable, mobile, or resorptive teeth via mucoperiosteal flaps and alveolar bone contouring.",
        "Administer multimodal analgesia (Local nerve blocks: Infraorbital, Mental, or Inferior Alveolar with Bupivacaine; plus NSAID).",
        "Prescribe antiseptic chlorhexidine (0.12%) oral rinse and soft wet diet for 10-14 days post-op."
      ]
    };
  }

  // =========================================================================
  // 0K. PARASITIC / FLEA, TICK & WORM INFESTATIONS
  // =========================================================================
  if (containsAnyWord(combined, 'tick', 'ticks', 'flea', 'fleas', 'worm', 'worms', 'tapeworm', 'roundworm', 'parasite', 'parasites', 'flea dirt', 'pot belly worms', 'scoots', 'scooting')) {
    return {
      clinicalSummary: `The patient (${sp}) suffers from active ectoparasitic infestation or internal helminthiasis. Secondary anemia, hypersensitivity dermatitis, and transmission of vector-borne pathogens warrant rapid broad-spectrum antiparasitic treatment.`,
      primaryDifferentials: [
        { name: "Severe Ectoparasitic Infestation (Ctenocephalides / Ixodes Ticks)", likelihood: "High (90%)", reasoning: `Visible ticks, flea dirt, severe pruritus, and localized alopecia in ${sp}.` },
        { name: "Intestinal Helminthiasis (Toxocara canis / Ancylostoma / Dipylidium)", likelihood: "Moderate (70%)", reasoning: "Unthrifty coat, pot-bellied appearance, diarrhea, or visible proglottids in stool." },
        { name: "Vector-Borne Infectious Disease (Ehrlichia / Anaplasma / Lyme / Babesia)", likelihood: "Moderate (45%)", reasoning: "Systemic lethargy, thrombocytopenia, or pyrexia secondary to tick transmission." }
      ],
      recommendedDiagnostics: [
        "Skin scraping and coat brushing with wet-paper flea dirt verification test",
        "Fecal centrifugal flotation and direct smear to identify helminth ova (ascarids, hookworms, whipworms)",
        "Comprehensive in-clinic vector-borne serology test (4Dx Plus / ELISA for Ehrlichia, Lyme, Anaplasma, Heartworm)",
        "Complete Blood Count (CBC) to screen for regenerative anemia and thrombocytopenia"
      ],
      emergencyActionProtocol: [
        "Administer immediate veterinary isoxazoline oral/topical ectoparasiticide (Simparica, NexGard, or Bravecto).",
        "Deworm with broad-spectrum anthelmintic combination (Pyrantel embonate / Febantel / Praziquantel).",
        "Carefully manually extract visible ticks using specialized tick-removal twisters without crushing the tick body.",
        "Thoroughly treat household environment and all in-contact pets to break flea life cycle."
      ]
    };
  }

  // 1. NEUROLOGY / SEIZURES / PARESIS / ATAXIA
  if (
    containsAnyWord(combined, 'seizure', 'seizures', 'status epilepticus', 'tremor', 'tremors',
      'ataxia', 'head tilt', 'paralysis', 'paresis', 'twitching', 'circling', 'nystagmus',
      'unconscious', 'coma', 'fits', 'epileptic', 'convulsion', 'convulsions')
  ) {
    return {
      clinicalSummary: `The patient (${sp}) exhibits severe central nervous system dysfunction characterized by seizure activity or acute neurological deficits. Immediate stabilization of cerebral perfusion and rapid termination of epileptiform activity are paramount to avoid secondary excitotoxic neuronal injury.`,
      primaryDifferentials: [
        { name: "Idiopathic Epilepsy / Cluster Seizures", likelihood: "High (75%)", reasoning: `Episodic tonic-clonic convulsions with normal interictal status in ${sp}.` },
        { name: "Intracranial Structural Pathology (Meningioma / Glioma / GME)", likelihood: "Moderate (55%)", reasoning: "Asymmetrical focal deficits, circling, head tilt, or altered mentation." },
        { name: "Metabolic / Toxic Encephalopathy (Hypoglycemia / Hepatoencephalopathy)", likelihood: "Moderate (45%)", reasoning: "Systemic metabolic derangements triggering secondary epileptiform thresholds." }
      ],
      recommendedDiagnostics: [
        "Point-of-care blood glucose and ionized calcium measurement (rapid hypoglycemia rule-out)",
        "Complete serum biochemistry panel including pre- and post-prandial bile acids and ammonia",
        "Magnetic Resonance Imaging (MRI) of brain with gadolinium contrast",
        "Cerebrospinal fluid (CSF) tap for nucleated cell count, cytology, and infectious disease PCR panel"
      ],
      emergencyActionProtocol: [
        "Administer Midazolam (0.2-0.5 mg/kg IV or intranasally) or Diazepam (0.5 mg/kg IV/rectal) for active seizures.",
        "If cluster seizures persist, load Levetiracetam (Keppra 60 mg/kg IV slow over 10 minutes).",
        "Secure patent airway, provide flow-by oxygen, and actively monitor core temperature to treat hyperthermia.",
        "Maintain head elevated at 30 degrees to minimize intracranial pressure (ICP)."
      ]
    };
  }

  // 2. ORTHOPEDIC / LAMENESS / MUSCULOSKELETAL
  if (
    containsAnyWord(combined, 'limp', 'limping', 'lame', 'lameness', 'cruciate', 'ccl', 'fracture',
      'drawer', 'swollen joint', 'bone', 'stifle', 'hip dysplasia', 'ivdd', 'spine pain', 'back pain',
      'bunny hop', 'bunny hopping', 'unable to walk', 'non-weight bearing', 'luxating patella')
  ) {
    return {
      clinicalSummary: `The patient (${sp}) presents with marked musculoskeletal impairment, non-weight bearing lameness, and localized pain response. Systematic orthopedic and neurological differentiation is required to distinguish soft tissue/ligamentous rupture from neurological compression or bony fracture.`,
      primaryDifferentials: [
        { name: "Cranial Cruciate Ligament (CCL) Rupture / Stifle Instability", likelihood: "High (80%)", reasoning: `Acute pelvic limb lameness with positive cranial drawer or tibial compression sign in ${sp}.` },
        { name: "Intervertebral Disc Disease (IVDD) / Lumbosacral Stenosis", likelihood: "Moderate (60%)", reasoning: "Spinal hyperpathia, kyphosis, or proprioceptive ataxia affecting pelvic limbs." },
        { name: "Appendicular Bone Fracture / Joint Luxation", likelihood: "Moderate (45%)", reasoning: "Acute trauma, crepitus, or focal periarticular swelling requiring radiography." }
      ],
      recommendedDiagnostics: [
        "Comprehensive orthogonal digital radiographs of affected joint and contralateral comparison view",
        "Orthopedic examination under light sedation (Cranial drawer test, Ortolani sign, Campbell test)",
        "Neurological evaluation including conscious proprioception, spinal reflexes, and deep pain perception",
        "Arthrocentesis and synovial fluid cytology if joint effusion or septic arthritis is suspected"
      ],
      emergencyActionProtocol: [
        "Enforce strict cage rest with padded bedding; avoid all running, jumping, and stairs.",
        "Initiate multimodal analgesia: Pure opioid (Methadone 0.2 mg/kg IV) or Buprenorphine; add approved NSAID once renal values confirmed.",
        "Immobilize unstable distal limb fractures with a temporary padded Robert Jones splint.",
        "Refer for orthopedic surgical stabilization (TPLO / Lateral suture / Open reduction) if rupture or displaced fracture confirmed."
      ]
    };
  }

  // 3. OPHTHALMOLOGY / OCULAR
  if (
    containsAnyWord(combined, 'eye', 'eyes', 'corneal', 'ulcer', 'squint', 'squinting',
      'blepharospasm', 'uveitis', 'glaucoma', 'cherry eye', 'cloudy eye', 'conjunctivitis',
      'third eyelid', 'blind', 'blindness', 'photophobia', 'cataract', 'cataracts')
  ) {
    return {
      clinicalSummary: `The patient (${sp}) presents with acute ocular distress, blepharospasm, and potential loss of corneal integrity or intraocular pressure dysregulation. Timely diagnostic staging is crucial to prevent irreversible corneal perforation or vision loss.`,
      primaryDifferentials: [
        { name: "Corneal Ulceration (Deep Stromal / Descemetocele)", likelihood: "High (80%)", reasoning: `Focal corneal defect, photophobia, epiphora, and blepharospasm in ${sp}.` },
        { name: "Acute Glaucoma vs Anterior Uveitis", likelihood: "Moderate (55%)", reasoning: "Episcleral injection, corneal edema, and abnormal intraocular pressure dynamics." },
        { name: "Keratoconjunctivitis Sicca (KCS) / Prolapsed Nictitans Gland", likelihood: "Moderate (40%)", reasoning: "Mucopurulent ocular discharge, dry conjunctiva, or prolapsed third eyelid tissue." }
      ],
      recommendedDiagnostics: [
        "Fluorescein dye corneal staining (mandatory to assess corneal epithelial integrity)",
        "Applanation Tonometry (Tono-Pen or TonoVet to measure Intraocular Pressure / IOP)",
        "Schirmer Tear Test-1 (STT-1) to evaluate quantitative basal tear production",
        "Slit-lamp biomicroscopy and direct ophthalmoscopy of anterior chamber and fundus"
      ],
      emergencyActionProtocol: [
        "Fit an Elizabethan collar (E-collar) immediately to prevent destructive self-trauma.",
        "CONTRAINDICATION: Do NOT administer any topical corticosteroids until corneal ulceration is completely excluded.",
        "Apply topical broad-spectrum ophthalmic antibiotic drops (e.g., Ofloxacin or Tobramycin q4-6h).",
        "Administer topical serum or equine autologous plasma drops if corneal melting/enzymatic malacia is present."
      ]
    };
  }

  // 4. DERMATOLOGY / OTOLOGY
  if (
    containsAnyWord(combined, 'ear', 'ears', 'scratching', 'head shaking', 'head shake',
      'otitis', 'pruritus', 'itching', 'itchy', 'alopecia', 'mange', 'mites', 'flea', 'fleas',
      'skin redness', 'hives', 'swelling face', 'facial swelling', 'hot spot', 'pyoderma')
  ) {
    return {
      clinicalSummary: `The patient (${sp}) presents with prominent cutaneous or otic inflammation, severe pruritus, and secondary epidermal barrier disruption. Prompt cytological identification of bacterial or fungal overgrowth is essential for targeted topical and systemic therapy.`,
      primaryDifferentials: [
        { name: "Acute Otitis Externa (Malassezia / Bacterial)", likelihood: "High (80%)", reasoning: `Erythematous vertical canal, malodorous brown ceruminous exudate, and head shaking in ${sp}.` },
        { name: "Atopic Dermatitis / Flea Allergy Dermatitis (FAD) Flare", likelihood: "Moderate (65%)", reasoning: "Ventral pruritus, secondary excoriations, and peri-anal or caudal lumbar alopecia." },
        { name: "Type I Hypersensitivity / Acute Facial Angioedema (Urticaria)", likelihood: "Moderate (45%)", reasoning: "Rapid-onset facial swelling, blepharoedema, or wheals secondary to insect sting or allergen." }
      ],
      recommendedDiagnostics: [
        "Bilateral otoscopic examination to evaluate canal stenosis and verify tympanic membrane integrity",
        "Ear swab cytology stained with Diff-Quik to quantify cocci, rods, and budding Malassezia yeast",
        "Superficial and deep skin scrapings (microscopic evaluation for Demodex, Sarcoptes, or Otodectes)",
        "Skin tape-strip cytology of affected lesions to evaluate superficial pyoderma"
      ],
      emergencyActionProtocol: [
        "For acute facial angioedema/allergic reaction: Administer Diphenhydramine (2 mg/kg IM) and Dexamethasone SP (0.15 mg/kg IV/IM).",
        "Perform gentle ear canal flushing with neutral non-ototoxic ceruminolytic agent (verify intact tympanum).",
        "Instill targeted combination otic suspension (e.g., Florfenicol/Terbinafine/Betamethasone).",
        "Initiate rapid antipruritic therapy (Oclacitinib / Apoquel or Lokivetmab / Cytopoint) for severe allergic flares."
      ]
    };
  }

  // 5. TOXICOLOGY / INGESTION / POISON
  if (
    containsAnyWord(combined, 'poison', 'rodenticide', 'rat poison', 'chocolate', 'onion',
      'garlic', 'grapes', 'raisin', 'raisins', 'xylitol', 'lily', 'lilies', 'paracetamol',
      'toxic', 'antifreeze', 'ethylene glycol', 'pesticide', 'ingested toxin', 'ate poison')
  ) {
    return {
      clinicalSummary: `The patient (${sp}) has confirmed or highly suspected exposure to a dangerous exogenous toxin. Immediate decontamination, calculation of toxic dose thresholds, and proactive organoprotective therapy are critical to prevent irreversible systemic organ failure or coagulopathy.`,
      primaryDifferentials: [
        { name: "Anticoagulant Rodenticide Toxicosis (Vitamin K1 Antagonism)", likelihood: "High (85%)", reasoning: `Exposure to bromadiolone/brodifacoum leading to severe coagulopathy and cavitary hemorrhage in ${sp}.` },
        { name: "Methylxanthine Toxicosis (Theobromine / Chocolate)", likelihood: "Moderate (65%)", reasoning: "CNS stimulation, tachycardia, cardiac arrhythmias, and vomiting secondary to dark chocolate ingestion." },
        { name: "Toxin-Induced Acute Kidney or Hepatic Injury (Lily / Xylitol / Grapes)", likelihood: "Moderate (50%)", reasoning: "Nephrotoxic or hepatotoxic cascade requiring aggressive IV diuresis." }
      ],
      recommendedDiagnostics: [
        "Baseline coagulation panel: Prothrombin Time (PT - prolongs earliest within 36-48h) and aPTT",
        "Serial blood glucose monitoring (crucial for xylitol-induced profound hypoglycemia)",
        "Comprehensive serum chemistry panel (BUN, Creatinine, Electrolytes, ALT, Total Bilirubin)",
        "Venous blood gas and baseline complete blood count (evaluate for hemolytic anemia or thrombocytopenia)"
      ],
      emergencyActionProtocol: [
        "If ingestion within 2 hours and patient is neurologically intact: Induce emesis with Apomorphine (0.03 mg/kg IV) or Clevor.",
        "Administer Activated Charcoal with sorbitol (1-2 g/kg PO) to bind toxin in the gastrointestinal tract.",
        "For anticoagulant rodenticide: Initiate Vitamin K1 therapy (2.5-5 mg/kg PO daily with fatty meal for 28-35 days).",
        "Start aggressive balanced IV crystalloid fluid diuresis (2-3x maintenance) for nephrotoxins."
      ]
    };
  }

  // 6. EQUINE SPECIFIC: COLIC
  if (sp.toLowerCase() === 'equine' || containsAnyWord(combined, 'colic', 'pawing', 'reflux', 'rolling', 'gut pain', 'nasogastric')) {
    return {
      clinicalSummary: `The patient (Equine) displays acute visceral pain consistent with large or small colon distension and potential ischemia. Immediate nasogastric decompression and peritoneal evaluation are essential to determine medical vs surgical management.`,
      primaryDifferentials: [
        { name: "Strangulating Large Colon Volvulus / Small Intestinal Entrapment", likelihood: "High (80%)", reasoning: "Unremitting violent colic pain unresponsive to systemic analgesics in equine." },
        { name: "Large Colon Impaction (Pelvic Flexure)", likelihood: "Moderate (50%)", reasoning: "Mild-to-moderate continuous colic with decreased fecal output." },
        { name: "Spasmodic Colic / Tympany", likelihood: "Moderate (40%)", reasoning: "Intermittent hypermotile bowel sounds responsive to antispasmodics." }
      ],
      recommendedDiagnostics: [
        "Immediate nasogastric intubation (assess net spontaneous fluid reflux volume)",
        "Transrectal palpation to evaluate pelvic flexure impaction or distended small bowel loops",
        "FLASH abdominal ultrasound protocol (evaluate intestinal wall thickness > 4mm)",
        "Abdominocentesis (evaluate peritoneal total protein and lactate level > 4 mmol/L)"
      ],
      emergencyActionProtocol: [
        "Pass nasogastric tube promptly to relieve gastric distension and prevent stomach rupture.",
        "Control visceral pain: Flunixin meglumine (1.1 mg/kg IV) or Xylazine (0.5 mg/kg IV).",
        "Prepare for emergency exploratory laparotomy if net reflux > 5L or peritoneal lactate elevated.",
        "Initiate rapid IV balanced fluid resuscitation via 10G jugular catheter."
      ]
    };
  }

  // 7. BOVINE / LARGE ANIMAL (BLOAT / MASTITIS / DOWNER COW)
  if (sp.toLowerCase() === 'bovine' || containsAnyWord(combined, 'cow', 'calf', 'bloat', 'rumen', 'milk fever', 'downer', 'abomasum', 'mastitis', 'lda')) {
    return {
      clinicalSummary: `The patient (${sp}) presents with acute ruminant metabolic, gastrointestinal, or periparturient compromise. Rapid assessment of ruminal motility, abomasal positioning, and systemic ionized minerals is essential to prevent permanent recumbency or ruminal asphyxiation.`,
      primaryDifferentials: [
        { name: "Acute Ruminal Tympany (Free-Gas or Frothy Bloat)", likelihood: "High (80%)", reasoning: `Marked distension of left paralumbar fossa, dyspnea, and ruminal hyper-resonance in ${sp}.` },
        { name: "Periparturient Hypocalcemia (Milk Fever / Downer Cow)", likelihood: "Moderate (65%)", reasoning: "Postpartum recumbency, 'S-curve' neck posture, cool extremities, and flaccid paralysis." },
        { name: "Left Displaced Abomasum (LDA) / Abomasal Volvulus", likelihood: "Moderate (50%)", reasoning: "Characteristic high-pitched musical 'ping' on left auscultation-percussion with ketosis." }
      ],
      recommendedDiagnostics: [
        "Simultaneous auscultation and percussion over 9th-13th ribs to evaluate characteristic metallic pings",
        "Ruminal fluid aspiration via stomach tube (assess pH, odor, stratification, and protozoal motility)",
        "Point-of-care serum ionized calcium and blood beta-hydroxybutyrate (BHB) concentration",
        "California Mastitis Test (CMT) of all four quarters to detect subclinical/clinical mastitis"
      ],
      emergencyActionProtocol: [
        "For severe life-threatening ruminal bloat: Pass large-bore stomach tube or perform emergency left paralumbar trocarization.",
        "For frothy bloat: Administer oral surfactant/anti-foaming agent (Poloxalene or mineral oil 500 mL).",
        "For hypocalcemia / milk fever: Infuse 500 mL of 23% Calcium borogluconate slowly IV while monitoring cardiac auscultation.",
        "Administer systemic NSAID (Flunixin meglumine 1.1-2.2 mg/kg IV) to counter endotoxemia."
      ]
    };
  }

  // 8. FELINE SPECIFIC: LOWER URINARY TRACT / OBSTRUCTION
  if (sp.toLowerCase() === 'feline' && containsAnyWord(combined, 'stranguria', 'straining', 'litter', 'block', 'blocked', 'urinary', 'hematuria', 'dysuria')) {
    return {
      clinicalSummary: `The patient (Feline) exhibits classic clinical manifestations of acute lower urinary tract disease with suspected mechanical or functional urethral obstruction. Urgent evaluation for hyperkalemia and post-renal azotemia is imperative.`,
      primaryDifferentials: [
        { name: "Feline Urethral Obstruction (FLUTD / Blocked Cat)", likelihood: "High (90%)", reasoning: "Tense, painful, non-expressible bladder with dysuria and vocalization in feline." },
        { name: "Feline Idiopathic Cystitis (FIC)", likelihood: "Moderate (55%)", reasoning: "Sterile neurogenic inflammation triggered by environmental stress." },
        { name: "Urolithiasis (Struvite or Calcium Oxalate Calculi)", likelihood: "Moderate (45%)", reasoning: "Cystic calculi causing mechanical outflow blockage." }
      ],
      recommendedDiagnostics: [
        "Immediate point-of-care serum potassium and creatinine evaluation (hyperkalemia triage)",
        "Lateral abdominal radiograph to assess for radiopaque calculi along urethral tract",
        "Urinalysis (sediment microscopy, crystals, urine protein-to-creatinine ratio)",
        "Bladder ultrasound to inspect mucosal thickening and intraluminal matrix plugs"
      ],
      emergencyActionProtocol: [
        "Immediate emergency decompressive cystocentesis if catheterization is delayed.",
        "Address life-threatening hyperkalemia: 10% Calcium gluconate (0.5-1.5 mL/kg slow IV with ECG monitoring).",
        "Place indwelling soft radiopaque tomcat catheter under sedation and flush with warm sterile saline.",
        "Initiate IV balanced crystalloids to correct metabolic acidosis and post-obstructive diuresis."
      ]
    };
  }

  // 9. ENDOCRINE & RENAL / POLYURIA & POLYDIPSIA (PU/PD)
  if (containsAnyWord(combined, 'water', 'drinking', 'polydipsia', 'urination', 'polyuria', 'pu/pd', 'diabetes', 'cushing', 'pot belly', 'kidney disease', 'renal failure')) {
    return {
      clinicalSummary: `The patient (${sp}) exhibits pronounced polyuria and compensatory polydipsia (PU/PD). This presentation points toward an underlying endocrine disturbance, renal tubular concentration failure, or systemic metabolic decompensation.`,
      primaryDifferentials: [
        { name: "Diabetes Mellitus with / without Diabetic Ketoacidosis (DKA)", likelihood: "High (80%)", reasoning: `Hyperglycemia, persistent glucosuria, polyphagia, and progressive muscle wasting in ${sp}.` },
        { name: "Chronic Kidney Disease (CKD / IRIS Staged)", likelihood: "Moderate (65%)", reasoning: "Loss of renal concentrating ability with low urine specific gravity and azotemia." },
        { name: "Hyperadrenocorticism (Cushing's Disease) or Hyperthyroidism", likelihood: "Moderate (45%)", reasoning: "Endocrine dysregulation accompanied by dermatological changes or polyphagia." }
      ],
      recommendedDiagnostics: [
        "Complete urinalysis via cystocentesis: Urine Specific Gravity (USG), dipstick (glucose, ketones, protein), and sediment",
        "Fasting blood glucose curve and serum Fructosamine concentration",
        "Comprehensive renal panel (Serum BUN, Creatinine, SDMA, Electrolytes, Phosphorus, Total Protein)",
        "Low-Dose Dexamethasone Suppression Test (LDDST) or ACTH stimulation test for adrenal evaluation"
      ],
      emergencyActionProtocol: [
        "NEVER restrict water intake; ensure constant free-choice access to fresh water.",
        "If ketones and metabolic acidosis present (DKA): Initiate regular crystalline insulin CRI and balanced IV fluid resuscitation.",
        "For newly diagnosed uncomplicated diabetes: Initiate maintenance intermediate insulin (Caninsulin / Glargine) with scheduled meals.",
        "Support renal perfusion with subcutaneous or balanced intravenous fluid therapy if azotemic."
      ]
    };
  }

  // 10. TRAUMA / HEMORRHAGE / WOUND / SHOCK
  if (containsAnyWord(combined, 'hit by car', 'hbc', 'trauma', 'wound', 'bleeding', 'hemorrhage', 'bite', 'collapsed', 'shock', 'laceration', 'cold paws', 'pale gums')) {
    return {
      clinicalSummary: `The patient (${sp}) is in acute post-traumatic shock with potential internal cavitary hemorrhage and hemodynamic collapse. Immediate vascular access, volume resuscitation, and trauma triage ultrasonography are the highest priorities.`,
      primaryDifferentials: [
        { name: "Hypovolemic / Hemorrhagic Shock secondary to Cavitary Trauma", likelihood: "High (85%)", reasoning: `Pale mucous membranes, weak thread-like pulses, and tachycardia following trauma in ${sp}.` },
        { name: "Hemoperitoneum / Splenic or Hepatic Laceration", likelihood: "Moderate (65%)", reasoning: "Abdominal distension with free peritoneal fluid on trauma ultrasound." },
        { name: "Traumatic Pneumothorax / Diaphragmatic Hernia", likelihood: "Moderate (50%)", reasoning: "Tachypnea, muffled thoracic sounds, and paradoxical abdominal breathing." }
      ],
      recommendedDiagnostics: [
        "Abdominal and Thoracic FAST (AFAST / TFAST) point-of-care ultrasound to locate free fluid pockets",
        "Emergency Packed Cell Volume (PCV) and Total Solids (TS) baseline with serial lactate monitoring",
        "Three-view orthogonal thoracic radiographs (perform only after patient is respiratively stabilized)",
        "Arterial blood pressure monitoring (Doppler or oscillometric) to guide volume endpoints"
      ],
      emergencyActionProtocol: [
        "Place dual large-bore peripheral IV catheters (16G or 18G) immediately.",
        "Administer balanced isotonic crystalloid shock bolus (Canine: 15-20 mL/kg, Feline: 5-10 mL/kg over 15 min).",
        "Apply direct digital pressure and compressive sterile dressings to all active external hemorrhage.",
        "Provide gentle flow-by oxygenation and administer pure opioid analgesia (Methadone 0.2 mg/kg IV)."
      ]
    };
  }

  // 11. OBSTETRICS / REPRODUCTIVE / DYSTOCIA / PYOMETRA
  if (containsAnyWord(combined, 'pregnant', 'whelping', 'dystocia', 'puppy stuck', 'uterine', 'pyometra', 'vulvar discharge', 'green discharge', 'mastitis', 'eclampsia')) {
    return {
      clinicalSummary: `The patient (${sp}) displays critical reproductive pathology or obstetric complications. Immediate differentiation between obstructive dystocia, fetal compromise, and uterine infection (pyometra) is vital to determine emergency surgical intervention.`,
      primaryDifferentials: [
        { name: "Obstructive Dystocia / Primary or Secondary Uterine Inertia", likelihood: "High (85%)", reasoning: `Prolonged unproductive straining (>30 min) or green lochial discharge prior to fetal delivery in ${sp}.` },
        { name: "Cystic Endometrial Hyperplasia - Pyometra Complex (Open or Closed)", likelihood: "Moderate (70%)", reasoning: "Purulent or sanguineous vulvar discharge, lethargy, fever, and leukocytosis in intact female." },
        { name: "Puerperal Hypocalcemia (Eclampsia / Milk Fever)", likelihood: "Moderate (40%)", reasoning: "Restlessness, muscle tremors, and stiff gait during peak lactation." }
      ],
      recommendedDiagnostics: [
        "Emergency abdominal ultrasound to assess fetal heart rates (< 150 bpm indicates severe fetal distress) and uterine fluid distension",
        "Digital abdominal radiograph to confirm fetal skull dimensions relative to maternal birth canal",
        "Point-of-care ionized calcium (iCa) and blood glucose evaluation",
        "CBC with differential leukogram to identify degenerative left-shift characteristic of closed pyometra"
      ],
      emergencyActionProtocol: [
        "If fetal bradycardia (< 150 bpm) or physical pelvic obstruction is confirmed: Prepare immediately for emergency Cesarean section.",
        "For confirmed pyometra: Administer IV broad-spectrum bactericidal antibiotics (Ampicillin-sulbactam) and schedule urgent ovariohysterectomy.",
        "For eclampsia: Slowly infuse 10% Calcium gluconate (0.5-1.5 mL/kg slow IV with continuous ECG monitoring).",
        "Establish warm neonatal resuscitation station with suction bulbs, oxygen, and naloxone."
      ]
    };
  }

  // 12. CARDIAC / CARDIOVASCULAR
  if (
    containsAnyWord(combined, 'syncope', 'murmur', 'tachycardia', 'arrhythmia', 'gallop',
      'congestive heart', 'chf', 'dcm', 'tamponade') || (combined.includes('cough') && combined.includes('heart'))
  ) {
    return {
      clinicalSummary: `The patient (${sp}) presents with marked cardiovascular compromise, pulse abnormalities, and potential hemodynamic instability. Immediate diagnostic confirmation and gentle handling are required to prevent fatal acute decompensation.`,
      primaryDifferentials: [
        { name: "Stage C Dilated Cardiomyopathy (DCM) / Arrhythmia", likelihood: "High (80%)", reasoning: `Evidence of cardiac compromise, pulse deficits, exercise intolerance or syncope in ${sp}.` },
        { name: "Congestive Heart Failure (CHF) with Pulmonary Edema", likelihood: "Moderate (65%)", reasoning: "Tachypnea, resting respiratory distress, and potential thoracic fluid congestion." },
        { name: "Pericardial Effusion with Cardiac Tamponade", likelihood: "Moderate (40%)", reasoning: "Muffled heart sounds and weak arterial pulses." }
      ],
      recommendedDiagnostics: [
        "Right lateral and dorsoventral thoracic radiographs to assess vertebral heart score (VHS)",
        "Transthoracic echocardiogram (verify fractional shortening and chamber dimensions)",
        "6-lead continuous electrocardiogram (ECG) to identify rhythm disturbance",
        "Serum NT-proBNP biomarker and cardiac Troponin I (cTnI) levels"
      ],
      emergencyActionProtocol: [
        "Provide supplemental oxygen cage or gentle flow-by (40-60% FiO2).",
        "Administer IV loop diuretic (Furosemide 2 mg/kg) if pulmonary crackles/edema present.",
        "Initiate oral inodilator (Pimobendan 0.25 mg/kg) once stabilized.",
        "Avoid aggressive fluid therapy or high sodium crystalloids."
      ]
    };
  }

  // 13. RESPIRATORY / DYSPNEA / ASTHMA / COUGH
  if (containsAnyWord(combined, 'dyspnea', 'tachypnea', 'cyanosis', 'stridor', 'wheezing', 'respiratory', 'cough', 'asthma', 'breathing hard')) {
    return {
      clinicalSummary: `The patient (${sp}) is in acute respiratory distress with compromised ventilatory mechanics and potential hypoxemia. Minimal-stress flow-by oxygenation and thoracic triage ultrasound (TFAST) are prioritized before stressful handling.`,
      primaryDifferentials: [
        { name: "Acute Respiratory Distress / Tension Pneumothorax", likelihood: "High (75%)", reasoning: `Rapid shallow tachypnea with cyanotic or pale mucous membranes in ${sp}.` },
        { name: "Severe Bronchoconstriction / Feline Asthma or RAO", likelihood: "Moderate (60%)", reasoning: "Prominent expiratory push, wheezing, and hyper-resonance on thoracic percussion." },
        { name: "Non-Cardiogenic Pulmonary Edema / Bacterial Pneumonia", likelihood: "Moderate (45%)", reasoning: "Diffuse pulmonary alveolar infiltrates secondary to infectious process or aspiration." }
      ],
      recommendedDiagnostics: [
        "TFAST (Thoracic Focused Assessment with Sonography for Trauma/Triage)",
        "Arterial blood gas (ABG) or pulse oximetry monitoring (SpO2)",
        "Three-view thoracic radiographs (defer if patient is too stressed for restraint)",
        "Complete CBC with differential leukogram to evaluate septic left-shift"
      ],
      emergencyActionProtocol: [
        "Immediate minimal-handling oxygen therapy (mask, hood, or oxygen cage).",
        "Perform emergency bilateral thoracocentesis in 7th-9th intercostal space if pneumothorax suspected.",
        "Inject rapid-acting bronchodilator (Terbutaline 0.01 mg/kg SC) or dexamethasone SP if asthma/anaphylaxis.",
        "Keep environmental noise and stress to an absolute minimum."
      ]
    };
  }

  // 14. GASTROENTERITIS / FEVER & INAPPETENCE
  if (containsAnyWord(combined, 'fever', 'temperature', 'eating', 'eaten', 'food', 'vomit', 'vomiting', 'diarrhea', 'stool', 'lethargic', 'lethargy', 'anorexia')) {
    return {
      clinicalSummary: `The patient (${sp}) presents with active gastrointestinal disturbance, pyrexia, and inappetence. Findings suggest mucosal inflammation, dehydration, and potential systemic inflammatory response requiring parenteral antiemetics and fluid therapy.`,
      primaryDifferentials: [
        { name: "Acute Gastroenteritis / Infectious Enteropathy (Parvovirus/Coronavirus)", likelihood: "High (80%)", reasoning: `Evidence of gastrointestinal compromise, emesis, anorexia, or pyrexia in ${sp}.` },
        { name: "Acute Pancreatitis / Systemic Inflammatory Response", likelihood: "Moderate (55%)", reasoning: "Inappetence with vomiting and secondary abdominal discomfort." },
        { name: "Gastrointestinal Foreign Body / Mechanical Obstruction", likelihood: "Moderate (40%)", reasoning: "Persistent emesis and refusal of food requiring radiographic rule-out." }
      ],
      recommendedDiagnostics: [
        "Complete Blood Count (CBC) with manual differential to assess leukocytosis or toxic change",
        "Comprehensive serum chemistry panel (BUN, Creatinine, Electrolytes, Spec cPL/fPL)",
        "Abdominal survey radiographs (two orthogonal views) to evaluate bowel pattern and rule out obstruction",
        "Fecal analysis (antigen screening and flotation for parasitic enteropathogens)"
      ],
      emergencyActionProtocol: [
        "Initiate balanced isotonic crystalloid rehydration therapy (adjust for % dehydration).",
        "Administer antiemetic: Maropitant citrate (1 mg/kg SC q24h) or Ondansetron (0.5 mg/kg IV q8h).",
        "Provide gastroprotectant support (Pantoprazole 1 mg/kg IV slow) if gastritis suspected.",
        "Withhold solid food until active emesis resolves, then introduce bland low-fat diet."
      ]
    };
  }

  // 15. DEFAULT ACUTE ABDOMEN / GASTRIC DILATATION-VOLVULUS
  return {
    clinicalSummary: `The patient (${sp}) presents with acute clinical compromise requiring comprehensive diagnostic staging and supportive stabilization. Initial physical triage and diagnostic imaging are indicated to establish a definitive diagnosis.`,
    primaryDifferentials: [
      { name: "Acute Abdomen / Visceral Distension", likelihood: "High (70%)", reasoning: `Generalized acute abdominal distress and systemic guarding in ${sp}.` },
      { name: "Systemic Inflammatory Response Syndrome (SIRS)", likelihood: "Moderate (50%)", reasoning: "Hemodynamic shifts requiring close fluid and electrolyte monitoring." },
      { name: "Occult Metabolic / Organ Dysfunction", likelihood: "Moderate (40%)", reasoning: "Nonspecific presentation requiring complete hematologic and biochemical screening." }
    ],
    recommendedDiagnostics: [
      "Complete Blood Count (CBC) and full serum chemistry with electrolyte panel",
      "Orthogonal abdominal survey radiographs to assess organ margins and gas patterns",
      "Abdominal Focused Assessment with Sonography (AFAST) to rule out free peritoneal effusion",
      "Venous blood gas and baseline lactate evaluation to monitor tissue perfusion"
    ],
    emergencyActionProtocol: [
      "Establish intravenous catheter access and begin supportive balanced crystalloid therapy.",
      "Administer appropriate analgesia based on pain score assessment.",
      "Monitor vital signs, capillary refill time, and hydration status continuously.",
      "Re-evaluate clinical parameters frequently following initial fluid stabilization."
    ]
  };
}

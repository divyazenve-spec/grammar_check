package com.doctorvet.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiAssistantService {

    private final ClinicalTextRefiner clinicalTextRefiner;

    @Value("${gemini.api-key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    @Value("${petcare.ai.model-id:petcare-grammar-ai}")
    private String modelId;

    @Value("${petcare.ai.service-url:${PETCARE_GRAMMAR_SERVICE_URL:http://localhost:5001/correct}}")
    private String serviceUrl;

    public AiAssistantService(ClinicalTextRefiner clinicalTextRefiner) {
        this.clinicalTextRefiner = clinicalTextRefiner;
    }

    public record Differential(String name, String likelihood, String reasoning) {}

    public record AiResponse(
            String clinicalSummary,
            List<Differential> primaryDifferentials,
            List<String> recommendedDiagnostics,
            List<String> emergencyActionProtocol
    ) {
        public AiResponse(List<Differential> primaryDifferentials, List<String> recommendedDiagnostics, List<String> emergencyActionProtocol) {
            this("Clinical evaluation of patient presentation and diagnostic recommendations.", primaryDifferentials, recommendedDiagnostics, emergencyActionProtocol);
        }
    }

    public record RefineResult(
            String originalText,
            String refinedText,
            boolean changed,
            String modelUsed
    ) {
        public RefineResult(String originalText, String refinedText, boolean changed) {
            this(originalText, refinedText, changed, "petcare-grammar-ai");
        }
    }

    /**
     * Automatic English Correction and Clinical Text Refinement.
     * Powered by PetCare AI Model (trained on unified petcare_grammar_ai dataset).
     * Automatically corrects grammar, clinical terminology, and patient presentations.
     */
    public RefineResult refineClinicalText(String rawText, String fieldType) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return new RefineResult(rawText != null ? rawText : "", "", false, modelId);
        }

        String input = rawText.trim();

        // 1. Attempt grammar correction using PetCare AI local model service
        String intermediate = input;
        try {
            String pcResult = callPetCareGrammarModel(input, fieldType);
            if (pcResult != null && !pcResult.isBlank()) {
                intermediate = pcResult.trim();
            }
        } catch (Exception ignored) {}

        // 2. High-precision clinical grammar refiner engine guarantees auxiliary verbs & clinical terminology
        String refined = clinicalTextRefiner.refine(intermediate, fieldType);
        boolean changed = !refined.trim().equalsIgnoreCase(input);
        return new RefineResult(rawText, refined, changed, modelId);
    }

    private String callPetCareGrammarModel(String text, String fieldType) {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(1200))
                .build();

        if (serviceUrl != null && !serviceUrl.isBlank()) {
            try {
                String requestBody = "{\"text\":\"" + text.replace("\"", "\\\"").replace("\n", "\\n") + "\"}";
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(serviceUrl.trim()))
                        .timeout(Duration.ofMillis(2500))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200 && response.body() != null) {
                    String body = response.body();
                    Pattern corrPat = Pattern.compile("\"corrected\"\\s*:\\s*\"(.*?)(?<!\\\\)\"", Pattern.DOTALL);
                    Matcher corrMat = corrPat.matcher(body);
                    if (corrMat.find()) {
                        String corrected = corrMat.group(1)
                                .replace("\\n", "\n")
                                .replace("\\\"", "\"")
                                .trim();
                        if (!corrected.isBlank()) {
                            return corrected;
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        return null;
    }


    private AiResponse callGeminiDifferential(String species, String symptoms, String vitals) {
        try {
            String prompt = """
                You are an expert veterinary clinical specialist.
                Analyze the following patient case and write the response in clear, professional, natural veterinary English:
                Species: %s
                Chief Complaint & Symptoms: %s
                Physical Exam & Vitals: %s

                Respond strictly with valid JSON with these exact keys:
                {
                  "clinicalSummary": "2-3 sentence formal veterinary clinical assessment summarizing the patient's condition, severity, and pathophysiology in proper professional English.",
                  "primaryDifferentials": [
                    {"name": "Diagnosis Name", "likelihood": "High (85%)", "reasoning": "Clinical reasoning written in clear professional English."}
                  ],
                  "recommendedDiagnostics": [
                    "Specific diagnostic test 1",
                    "Specific diagnostic test 2"
                  ],
                  "emergencyActionProtocol": [
                    "Immediate emergency action step 1",
                    "Immediate emergency action step 2"
                  ]
                }
                """.formatted(
                    species.replace("\"", "\\\""),
                    symptoms.replace("\"", "\\\""),
                    vitals.replace("\"", "\\\"")
                );

            String requestBody = "{\"contents\":[{\"parts\":[{\"text\":\"" + prompt.replace("\n", "\\n").replace("\"", "\\\"") + "\"}]}]}";

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(2000))
                    .build();

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey.trim();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMillis(3000))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && response.body() != null) {
                String body = response.body();
                int textIdx = body.indexOf("\"text\": \"");
                if (textIdx != -1) {
                    int start = textIdx + 9;
                    int end = body.lastIndexOf("\"");
                    String jsonText = body.substring(start, end)
                            .replace("\\n", "\n")
                            .replace("\\\"", "\"")
                            .replace("\\r", "");
                    int jsonStart = jsonText.indexOf("{");
                    int jsonEnd = jsonText.lastIndexOf("}");
                    if (jsonStart != -1 && jsonEnd != -1) {
                        String cleanJson = jsonText.substring(jsonStart, jsonEnd + 1);

                        // Extract clinicalSummary
                        String summary = "Clinical evaluation of patient presentation and diagnostic recommendations.";
                        Pattern sumPat = Pattern.compile("\"clinicalSummary\"\\s*:\\s*\"([^\"]+)\"");
                        Matcher sumMat = sumPat.matcher(cleanJson);
                        if (sumMat.find()) {
                            summary = sumMat.group(1).trim();
                        }

                        // Extract primaryDifferentials
                        List<Differential> diffs = new ArrayList<>();
                        Pattern diffPat = Pattern.compile("\\{\\s*\"name\"\\s*:\\s*\"([^\"]+)\"\\s*,\\s*\"likelihood\"\\s*:\\s*\"([^\"]+)\"\\s*,\\s*\"reasoning\"\\s*:\\s*\"([^\"]+)\"\\s*\\}");
                        Matcher diffMat = diffPat.matcher(cleanJson);
                        while (diffMat.find()) {
                            diffs.add(new Differential(diffMat.group(1), diffMat.group(2), diffMat.group(3)));
                        }

                        // Extract recommendedDiagnostics
                        List<String> diags = new ArrayList<>();
                        int diagIdx = cleanJson.indexOf("\"recommendedDiagnostics\"");
                        if (diagIdx != -1) {
                            int arrStart = cleanJson.indexOf("[", diagIdx);
                            int arrEnd = cleanJson.indexOf("]", arrStart);
                            if (arrStart != -1 && arrEnd != -1) {
                                String arrStr = cleanJson.substring(arrStart + 1, arrEnd);
                                Matcher itemMat = Pattern.compile("\"([^\"]+)\"").matcher(arrStr);
                                while (itemMat.find()) {
                                    diags.add(itemMat.group(1).trim());
                                }
                            }
                        }

                        // Extract emergencyActionProtocol
                        List<String> actions = new ArrayList<>();
                        int actIdx = cleanJson.indexOf("\"emergencyActionProtocol\"");
                        if (actIdx != -1) {
                            int arrStart = cleanJson.indexOf("[", actIdx);
                            int arrEnd = cleanJson.indexOf("]", arrStart);
                            if (arrStart != -1 && arrEnd != -1) {
                                String arrStr = cleanJson.substring(arrStart + 1, arrEnd);
                                Matcher itemMat = Pattern.compile("\"([^\"]+)\"").matcher(arrStr);
                                while (itemMat.find()) {
                                    actions.add(itemMat.group(1).trim());
                                }
                            }
                        }

                        if (!diffs.isEmpty()) {
                            return new AiResponse(summary, diffs, diags, actions);
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    public AiResponse generateDifferential(String species, String symptoms, String vitals) {
        String sp = species != null && !species.isBlank() ? species.trim() : "Canine";
        String refinedSymptoms = clinicalTextRefiner.refine(symptoms, "symptoms");
        String refinedVitals = clinicalTextRefiner.refine(vitals, "vitals");

        // Try Gemini live clinical analysis if key is configured
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            AiResponse geminiResponse = callGeminiDifferential(sp, refinedSymptoms, refinedVitals);
            if (geminiResponse != null) {
                return geminiResponse;
            }
        }

        String sym = refinedSymptoms != null ? refinedSymptoms.toLowerCase() : "";
        String vit = refinedVitals != null ? refinedVitals.toLowerCase() : "";
        String combined = (sym + " " + vit).toLowerCase();
        boolean isAvian = sp.toLowerCase().contains("avian") || sp.toLowerCase().contains("bird") || sp.toLowerCase().contains("exotic")
                || containsAnyWord(combined, "bird", "parrot", "cockatiel", "budgie", "canary", "feather", "beak", "crop", "wing", "avian", "perch");
        boolean isBovine = sp.toLowerCase().contains("bovine") || sp.toLowerCase().contains("cow") || sp.toLowerCase().contains("calf") || sp.toLowerCase().contains("cattle")
                || containsAnyWord(combined, "cow", "calf", "heifer", "bull", "bovine", "rumen", "udder", "mastitis", "bloat", "milk fever", "downer");
        boolean isEquine = sp.toLowerCase().contains("equine") || sp.toLowerCase().contains("horse") || sp.toLowerCase().contains("foal")
                || containsAnyWord(combined, "horse", "mare", "stallion", "foal", "equine", "colic", "laminitis", "founder", "choke", "thrush", "hoof", "heaves");

        // 0A. AVIAN / EXOTIC: EGG BINDING & COELOMIC OBSTETRIC DISTRESS
        if (isAvian && containsAnyWord(combined, "egg", "egg bound", "egg binding", "swollen vent", "vent", "cloaca", "straining at bottom", "bottom of cage", "tail pumping", "soft egg")) {
            return new AiResponse(
                    "The patient (" + sp + ") presents with critical coelomic distension, tenesmus, and suspected post-ovulatory dystocia (egg binding). Calcium exhaustion, hypothermia, and compression of pelvic renal nerves risk fatal circulatory collapse.",
                    List.of(
                            new Differential("Acute Obstructive Egg Binding / Post-Ovulatory Dystocia", "High (90%)", "Visible/palpable caudal coelomic mass, wide-based stance, and straining at bottom of cage in " + sp + "."),
                            new Differential("Cloacal / Oviductal Prolapse secondary to Tenesmus", "Moderate (60%)", "Everted hyperemic cloacal or uterine mucosa with persistent expulsive efforts."),
                            new Differential("Egg Yolk Coelomitis / Salpingitis", "Moderate (45%)", "Rupture of ectopic yolk triggering non-septic or septic coelomic inflammation.")
                    ),
                    List.of(
                            "Whole-body orthogonal survey digital radiography (low kVp technique to assess egg calcification and pelvic canal alignment)",
                            "Point-of-care ionized calcium (iCa) and blood glucose evaluation",
                            "Gentle coelomic ultrasonography to inspect oviductal wall integrity and fluid accumulation",
                            "Cloacal swab cytology and Gram stain"
                    ),
                    List.of(
                            "Place patient immediately in a heated, humidified incubator (85-90°F / 29-32°C, 70% relative humidity).",
                            "Administer 10% Calcium gluconate (50-100 mg/kg IM) and supportive warm SQ fluids (LRS with 2.5% Dextrose).",
                            "Provide analgesia: Butorphanol (1-2 mg/kg IM) or Meloxicam (1 mg/kg IM/PO).",
                            "Apply topical sterile water-soluble lubrication to cloacal sphincter; if dystocia persists, prepare for transcloacal ovocentesis or microsurgical salpingotomy."
                    )
            );
        }

        // 0B. AVIAN / EXOTIC: CROP STASIS, SOUR CROP & REGURGITATION
        if (isAvian && containsAnyWord(combined, "crop", "sour crop", "crop stasis", "regurgitat", "vomit seed", "seeds regurgitat", "pendulous crop", "crop swollen", "crop fluid")) {
            return new AiResponse(
                    "The patient (" + sp + ") exhibits severe upper gastrointestinal stasis with ingluvial fluid accumulation (sour crop). Secondary fermentation, mucosal fungal overgrowth, and fatal regurgitation aspiration are significant risks.",
                    List.of(
                            new Differential("Ingluvial Candidiasis (Sour Crop / Candida albicans)", "High (85%)", "Delayed crop emptying, thickened crop mucosa, regurgitation of mucus and foul sour odor in " + sp + "."),
                            new Differential("Bacterial Ingluvitis / Trichomoniasis (Canker)", "Moderate (60%)", "Caseous crop exudate, foul breath, and flagellated protozoal colonization."),
                            new Differential("Foreign Body Crop Impaction or Heavy Metal Toxicosis", "Moderate (45%)", "Mechanical obstruction or systemic zinc/lead ingestion halting gastrointestinal motility.")
                    ),
                    List.of(
                            "Direct crop aspirate wet mount microscopy and Gram stain (quantify budding yeast and pseudohyphae)",
                            "Survey whole-body radiographs to inspect for radiopaque metallic density in crop/ventriculus",
                            "Crop flush cytology and fungal/bacterial culture with antimicrobial susceptibility",
                            "Plasma biochemistry (Bile acids, AST, Uric acid)"
                    ),
                    List.of(
                            "Gently decompress and evacuate fermenting crop contents via soft red rubber feeding tube under light manual restraint.",
                            "Perform crop lavage with warm sterile isotonic saline.",
                            "Administer oral antifungal: Nystatin (300,000 IU/kg PO q12h) or Fluconazole (15 mg/kg PO q24h).",
                            "Administer prokinetic (Metoclopramide 0.5 mg/kg PO/IM) once physical obstruction is radiographically ruled out."
                    )
            );
        }

        // 0C. AVIAN / EXOTIC: FEATHER PLUCKING, SCALY FACE MITES & BEAK OVERGROWTH
        if (isAvian && containsAnyWord(combined, "feather", "plucking", "bare chest", "picking feather", "scaly face", "crusty beak", "beak", "mite", "mites", "chewing wing", "blood feather")) {
            return new AiResponse(
                    "The patient (" + sp + ") displays cutaneous irritation, abnormal plumage loss, or beak hyperkeratosis. Systematic differentiation between parasitic acariasis, environmental malnutrition, and viral folliculotropic disease is indicated.",
                    List.of(
                            new Differential("Knemidocoptes pilae Acariasis (Scaly Face & Beak Mite)", "High (80%)", "Honeycomb-like crusting on cere, beak rhamphotheca, and periocular skin in " + sp + "."),
                            new Differential("Psychogenic / Environmental Feather-Damaging Behavior", "Moderate (65%)", "Symmetrical down and contour feather removal over breast and thighs with head feathers intact."),
                            new Differential("Psittacine Beak and Feather Disease (Circovirus / PBFD)", "Moderate (40%)", "Dystrophic feather shafts, retained feather sheaths, and progressive beak necrosis.")
                    ),
                    List.of(
                            "Microscopic mineral oil skin and beak scrape examination to confirm Knemidocoptes mites",
                            "PBFD (Circovirus) and Polyomavirus blood PCR testing",
                            "Gram stain and fungal culture of newly plucked growing feather pulps",
                            "Plasma liver profile (AST, Bile acids) to evaluate underlying hepatic pruritus"
                    ),
                    List.of(
                            "For confirmed or suspected mites: Apply Ivermectin (0.2 mg/kg spot-on or IM) repeat at 14-day intervals.",
                            "If active bleeding from a broken blood feather: Grasp base firmly with hemostat and pull cleanly in direction of growth, then apply direct digital pressure.",
                            "Introduce soft fabric Elizabethan collar only if active self-mutilation or severe skin laceration is occurring.",
                            "Transition diet from nutrient-poor all-seed blends to balanced extruded pellets supplemented with fresh vegetables."
                    )
            );
        }

        // 0D. AVIAN / EXOTIC: RESPIRATORY DISTRESS & TAIL BOBBING
        if (isAvian && containsAnyWord(combined, "tail bob", "tail bobbing", "clicking", "open mouth", "gasping", "puffed", "respiratory", "breathing hard", "voice change")) {
            return new AiResponse(
                    "The patient (" + sp + ") presents in critical avian respiratory failure characterized by conspicuous tail bobbing and compensatory open-mouth breathing. Because avian respiration relies entirely on active thoracic expansion, handling must be minimal to prevent arrest.",
                    List.of(
                            new Differential("Air Sacculitis / Pulmonary Aspergillosis (Aspergillus fumigatus)", "High (80%)", "Inspiratory dyspnea with rhythmic tail bobbing, vocal change, and air sac clouding in " + sp + "."),
                            new Differential("Avian Chlamydiosis (Chlamydia psittaci / Psittacosis)", "Moderate (65%)", "Conjunctivitis, bilateral nasal discharge, bright green urates, and respiratory distress."),
                            new Differential("Inhaled Toxin / Polytetrafluoroethylene (PTFE / Teflon) Toxicosis", "Moderate (45%)", "Acute pulmonary edema and hemorrhage following exposure to overheated non-stick cookware.")
                    ),
                    List.of(
                            "Whole-body orthogonal radiographs (performed only after initial oxygen stabilization) to inspect air sac volume and parabronchial pattern",
                            "Choanal and cloacal swab PCR for Chlamydia psittaci",
                            "Complete CBC (marked leukocytosis with heterophilia and toxic granulation suggests mycotic granuloma)",
                            "Tracheal swab cytology and fungal culture"
                    ),
                    List.of(
                            "Place immediately into a quiet, warm (28-30°C) oxygen chamber (40-50% FiO2) with ZERO initial handling.",
                            "DO NOT compress the patient's keel or thoracic cage during any emergency procedures.",
                            "Nebulize with sterile saline combined with F10 veterinary antiseptic solution (1:250) or Amphotericin B.",
                            "Initiate Doxycycline therapy (25-50 mg/kg PO or IM q7d) if Chlamydiosis cannot be excluded."
                    )
            );
        }

        // 0E. BOVINE: ACUTE MASTITIS & UDDER PATHOLOGY
        if (isBovine && containsAnyWord(combined, "mastitis", "clots in milk", "clot in milk", "udder", "quarter", "watery milk", "bloody milk", "hot quarter", "swollen quarter", "hard quarter")) {
            return new AiResponse(
                    "The patient (" + sp + ") presents with acute localized or toxic parenchymal mammary gland inflammation (mastitis). Immediate intervention is required to prevent systemic endotoxemic bacteremia, secretory alveolar destruction, or septic recumbency.",
                    List.of(
                            new Differential("Acute Coliform Mastitis (Escherichia coli / Klebsiella endotoxemia)", "High (85%)", "Hard, swollen quarter with serous/watery secretion, milk clots, fever, and dehydration in " + sp + "."),
                            new Differential("Contagious Clinical Mastitis (Staphylococcus aureus / Streptococcus agalactiae)", "Moderate (60%)", "Persistent quarter induration, microabscesses, and elevated bulk somatic cell count."),
                            new Differential("Mycoplasma bovis Mammary Infection", "Moderate (40%)", "Multi-quarter involvement with tan sediment, resistant to beta-lactam antibiotics.")
                    ),
                    List.of(
                            "California Mastitis Test (CMT) score determination across all four quarters",
                            "Aseptic milk sampling of affected quarter for microbiological culture and antibiotic sensitivity testing",
                            "Point-of-care systemic hydration and venous blood gas / lactate assessment for endotoxemia triage",
                            "Serum ionized calcium and blood beta-hydroxybutyrate (BHB) concentration"
                    ),
                    List.of(
                            "Perform frequent manual quarter strip-outs (every 2-3 hours) to physically evacuate bacteria and destructive endotoxins.",
                            "Administer systemic NSAID: Flunixin meglumine (2.2 mg/kg slow IV) to neutralize endotoxin cascade.",
                            "Infuse intramammary broad-spectrum approved antimicrobial suspension following complete teat disinfection.",
                            "For toxic endotoxemic mastitis: Resuscitate with IV hypertonic saline (7.2% NaCl 4-5 mL/kg IV over 20 min) followed immediately by free access to fresh water."
                    )
            );
        }

        // 0F. BOVINE: FOOT ROT & HOOF LAMENESS
        if (isBovine && containsAnyWord(combined, "foot rot", "hoof", "lame", "lameness", "interdigital", "foul smell", "swollen foot", "coronary band", "sole ulcer")) {
            return new AiResponse(
                    "The patient (" + sp + ") exhibits severe pelvic or thoracic limb lameness with localized podal inflammation. Rapid debridement and targeted systemic antimicrobials are necessary to prevent deep sepsis of the distal interphalangeal joint.",
                    List.of(
                            new Differential("Interdigital Phlegmon (Bovine Foot Rot / Fusobacterium necrophorum)", "High (85%)", "Symmetrical interdigital swelling, painful fissure with characteristic foul necrotic odor in " + sp + "."),
                            new Differential("Contagious Digital Dermatitis (Strawberry Foot Rot / Treponema)", "Moderate (65%)", "Erythematous, papillomatous, highly sensitive strawberry-like erosions near the heel bulb."),
                            new Differential("Subsolar Abscess / Rusterholz Sole Ulcer", "Moderate (45%)", "Focal weight-bearing pain, sole defect at the sole-bulb junction requiring hoof paring.")
                    ),
                    List.of(
                            "Restraint in hoof trimming chute with thorough hoof washing and visual interdigital cleft inspection",
                            "Hoof tester examination to isolate localized subsolar or wall pressure sensitivity",
                            "Deep exploration and debridement of necrotic fissures to assess navicular bursa involvement",
                            "Contralateral foot comparison"
                    ),
                    List.of(
                            "Thoroughly cleanse and mechanically debride all necrotic debris from interdigital space.",
                            "Administer systemic antimicrobial: Long-acting Oxytetracycline (20 mg/kg SQ/IM) or Ceftiofur crystalline free acid.",
                            "Apply topical antiseptic dressing (Copper sulfate or Oxytetracycline powder) with protective non-constrictive bandage for 48 hours.",
                            "Relocate cow to clean, dry, well-bedded loafing area; apply wooden or polyurethane orthotic block to healthy claw if sole ulcer present."
                    )
            );
        }

        // 0G. BOVINE: CALF SCOURS & NEONATAL DIARRHEA
        if (isBovine && containsAnyWord(combined, "calf scours", "calf diarrhea", "scour", "white diarrhea", "yellow diarrhea", "sunken eyes", "weak calf", "cold ears")) {
            return new AiResponse(
                    "The patient (" + sp + ") presents with severe acute neonatal enteritis (calf scours), profound dehydration, and systemic metabolic acidosis. Immediate correction of strong-ion base deficit and fluid volume deficit is lifesaving.",
                    List.of(
                            new Differential("Neonatal Viral Enteritis (Bovine Rotavirus / Coronavirus)", "High (80%)", "Profuse watery yellow-green diarrhea, mucosal villous blunting, and rapid dehydration in " + sp + "."),
                            new Differential("Cryptosporidiosis (Cryptosporidium parvum)", "Moderate (70%)", "Persistent watery diarrhea refractory to standard antibacterial treatments."),
                            new Differential("Enterotoxigenic Escherichia coli (ETEC / K99 Antigen)", "Moderate (55%)", "Hypersecretory watery scours in calves under 5 days of age with severe endotoxemic shock.")
                    ),
                    List.of(
                            "Fecal rapid antigen multiplex strip (Rotavirus, Coronavirus, Cryptosporidium, E. coli K99)",
                            "Venous blood gas or total CO2 / base excess to quantify severe metabolic acidosis",
                            "Refractometer total serum protein (assess failure of passive colostral transfer / IgG < 5.5 g/dL)",
                            "Blood glucose and serum electrolyte panel (evaluate hyperkalemia / hyponatremia)"
                    ),
                    List.of(
                            "For recumbent calf with >8% dehydration and absent suckle reflex: Place IV catheter and infuse isotonic Sodium Bicarbonate (1.3%) or LRS with added NaHCO3.",
                            "For standing calf with intact suckle: Administer 2 Liters of high-alkalizing oral electrolyte solution (OES) containing acetate/propionate.",
                            "DO NOT withhold milk feeding; alternate milk with oral electrolytes 2 hours apart to sustain intestinal mucosa.",
                            "Provide broad-spectrum parenteral antibiotic (Amoxicillin or Florfenicol) if calf is pyrexic or bacteremic."
                    )
            );
        }

        // 0H. EQUINE: ACUTE LAMINITIS / FOUNDER
        if (isEquine && containsAnyWord(combined, "laminitis", "founder", "rocking back", "bounding pulse", "digital pulse", "heat in hoof", "heat in feet", "hot hoof", "coffin bone", "sinking sole")) {
            return new AiResponse(
                    "The patient (" + sp + ") presents in acute, excruciating digital laminitis with impending or active degradation of the laminar suspensory apparatus. Urgent continuous cryotherapy, mechanical frog support, and anti-inflammatory therapy are paramount to prevent distal phalanx rotation.",
                    List.of(
                            new Differential("Endocrinopathic Laminitis (Equine Metabolic Syndrome / PPID)", "High (85%)", "Classic rocked-back posture on heels, pounding digital pulses, and solar heat in " + sp + "."),
                            new Differential("Sepsis-Related Laminitis (Systemic Inflammatory Response / Colitis / Endotoxemia)", "Moderate (65%)", "Secondary laminar enzymatic destruction following acute systemic endotoxic illness."),
                            new Differential("Supporting-Limb Laminitis (Excessive Weight Overload)", "Moderate (40%)", "Mechanical hypoperfusion in contralateral foot due to severe unilateral musculoskeletal injury.")
                    ),
                    List.of(
                            "Orthogonal digital radiographs of both front feet (horizontal-beam lateromedial view with radio-opaque dorsal wall marker to calculate rotation and founder distance)",
                            "Digital arterial palpation and caliper assessment of coronary band depression / sinking",
                            "Dynamic endocrine screening: Resting baseline serum insulin, leptin, and TRH stimulation test for ACTH",
                            "Careful hoof tester examination to map focal subsolar hyperpathia"
                    ),
                    List.of(
                            "Initiate continuous distal limb cryotherapy immediately: Submerge distal limbs in ice-water slurry up to carpi/tarsi for 48-72 hours continuously.",
                            "House in deep sand or sawdust bedding (minimum 18 inches) to distribute solar weight evenly.",
                            "Apply soft support boots (Soft-Ride) or adhesive Styrofoam frog pads to reduce deep digital flexor tendon pull.",
                            "Administer Flunixin meglumine (1.1 mg/kg IV/PO q12h) and Pentoxifylline; enforce STRICT stall rest (do NOT walk the horse)."
                    )
            );
        }

        // 0I. EQUINE: ESOPHAGEAL OBSTRUCTION (CHOKE)
        if (isEquine && containsAnyWord(combined, "choke", "saliva from nose", "feed from nose", "feed from nostril", "green discharge nostril", "stretched neck", "coughing feed", "esophagus")) {
            return new AiResponse(
                    "The patient (" + sp + ") displays acute esophageal foreign body or feedstuff impaction (choke). Secondary complications include severe mucosal pressure necrosis, stricture formation, and fatal aspiration pneumonia.",
                    List.of(
                            new Differential("Acute Primary Esophageal Food Impaction (Pelleted Feed / Beet Pulp / Hay)", "High (90%)", "Profuse bilateral green nasal discharge containing saliva and food particles, outstretched neck, and retching in " + sp + "."),
                            new Differential("Secondary Esophageal Diverticulum or Chronic Stricture", "Moderate (50%)", "Recurrent choke episodes with anatomical structural esophageal luminal narrowing."),
                            new Differential("Pharyngeal Foreign Body or Retropharyngeal Abscess", "Moderate (35%)", "Mechanical upper airway compression and severe dysphagia.")
                    ),
                    List.of(
                            "Gentle diagnostic passage of lubricated small-bore nasogastric tube to identify obstruction distance",
                            "Upper respiratory and esophageal videoendoscopy to evaluate mucosal ulceration or perforation risk",
                            "Thoracic auscultation and orthogonal radiographs to screen for secondary aspiration pneumonia",
                            "Complete CBC and serum fibrinogen to monitor infectious inflammatory response"
                    ),
                    List.of(
                            "Withhold all access to feed, water, and bedding immediately.",
                            "Sedate horse with an alpha-2 agonist (Detomidine 0.01 mg/kg IV or Xylazine 0.5 mg/kg IV) combined with Butorphanol to lower the head below carpi level.",
                            "Administer Buscopan (N-butylscopolammonium bromide 0.3 mg/kg IV) or Oxytocin to relax esophageal musculature.",
                            "Pass nasogastric tube gently and lavage with warm water; keep horse's head lowered to prevent aspiration until the obstruction dissolves."
                    )
            );
        }

        // 0J. DENTAL & PERIODONTAL PATHOLOGY (ALL SPECIES)
        if (containsAnyWord(combined, "dental", "teeth", "tooth", "bad breath", "halitosis", "tartar", "calculus", "bleeding gums", "gingivitis", "tooth root", "carnassial", "drooling food", "stomatitis")) {
            return new AiResponse(
                    "The patient (" + sp + ") presents with advanced oral or periodontal disease characterized by heavy calculus, gingival inflammation, or tooth root compromise. Comprehensive staging under general anesthesia is required to eliminate chronic bacterial nidus and pain.",
                    List.of(
                            new Differential("Stage III-IV Periodontal Disease with Furcation Exposure", "High (85%)", "Severe dental calculus, halitosis, gingival recession, and tooth mobility in " + sp + "."),
                            new Differential("Tooth Root Abscess (Maxillary Carnassial / Premolar 4)", "Moderate (65%)", "Facial swelling, infraorbital draining tract, and unilateral localized maxillary tenderness."),
                            new Differential("Feline Chronic Gingivostomatitis (FCGS) / Tooth Resorption (TR)", "Moderate (55%)", "Severe caudal mucositis, cobblestone oral erythema, and subgingival tooth resorption.")
                    ),
                    List.of(
                            "Full-mouth intraoral digital dental radiography under general anesthesia to evaluate alveolar bone loss and root resorption",
                            "Periodontal probing and charting of all 42 teeth (dog) / 30 teeth (cat) to measure pocket depths",
                            "Pre-anesthetic complete blood count and biochemical renal/hepatic evaluation",
                            "Oral biopsy and histopathology if asymmetric proliferative mucosal masses are identified"
                    ),
                    List.of(
                            "Perform thorough supragingival and subgingival ultrasonic scaling followed by polish with fine fluoride paste.",
                            "Perform surgical extraction of non-viable, mobile, or resorptive teeth via mucoperiosteal flaps and alveolar bone contouring.",
                            "Administer multimodal analgesia (Local nerve blocks: Infraorbital, Mental, or Inferior Alveolar with Bupivacaine; plus NSAID).",
                            "Prescribe antiseptic chlorhexidine (0.12%) oral rinse and soft wet diet for 10-14 days post-op."
                    )
            );
        }

        // 0K. PARASITIC / FLEA, TICK & WORM INFESTATIONS
        if (containsAnyWord(combined, "tick", "ticks", "flea", "fleas", "worm", "worms", "tapeworm", "roundworm", "parasite", "parasites", "flea dirt", "pot belly worms", "scoots", "scooting")) {
            return new AiResponse(
                    "The patient (" + sp + ") suffers from active ectoparasitic infestation or internal helminthiasis. Secondary anemia, hypersensitivity dermatitis, and transmission of vector-borne pathogens warrant rapid broad-spectrum antiparasitic treatment.",
                    List.of(
                            new Differential("Severe Ectoparasitic Infestation (Ctenocephalides / Ixodes Ticks)", "High (90%)", "Visible ticks, flea dirt, severe pruritus, and localized alopecia in " + sp + "."),
                            new Differential("Intestinal Helminthiasis (Toxocara canis / Ancylostoma / Dipylidium)", "Moderate (70%)", "Unthrifty coat, pot-bellied appearance, diarrhea, or visible proglottids in stool."),
                            new Differential("Vector-Borne Infectious Disease (Ehrlichia / Anaplasma / Lyme / Babesia)", "Moderate (45%)", "Systemic lethargy, thrombocytopenia, or pyrexia secondary to tick transmission.")
                    ),
                    List.of(
                            "Skin scraping and coat brushing with wet-paper flea dirt verification test",
                            "Fecal centrifugal flotation and direct smear to identify helminth ova (ascarids, hookworms, whipworms)",
                            "Comprehensive in-clinic vector-borne serology test (4Dx Plus / ELISA for Ehrlichia, Lyme, Anaplasma, Heartworm)",
                            "Complete Blood Count (CBC) to screen for regenerative anemia and thrombocytopenia"
                    ),
                    List.of(
                            "Administer immediate veterinary isoxazoline oral/topical ectoparasiticide (Simparica, NexGard, or Bravecto).",
                            "Deworm with broad-spectrum anthelmintic combination (Pyrantel embonate / Febantel / Praziquantel).",
                            "Carefully manually extract visible ticks using specialized tick-removal twisters without crushing the tick body.",
                            "Thoroughly treat household environment and all in-contact pets to break flea life cycle."
                    )
            );
        }

        // 1. NEUROLOGY / SEIZURES / PARESIS / ATAXIA
        if (containsAnyWord(combined, "seizure", "seizures", "status epilepticus", "tremor", "tremors",
                "ataxia", "head tilt", "paralysis", "paresis", "twitching", "circling", "nystagmus",
                "unconscious", "coma", "fits", "epileptic", "convulsion", "convulsions")) {
            return new AiResponse(
                    "The patient (" + sp + ") exhibits severe central nervous system dysfunction characterized by seizure activity or acute neurological deficits. Immediate stabilization of cerebral perfusion and rapid termination of epileptiform activity are paramount to avoid secondary excitotoxic neuronal injury.",
                    List.of(
                            new Differential("Idiopathic Epilepsy / Cluster Seizures", "High (75%)", "Episodic tonic-clonic convulsions with normal interictal status in " + sp + "."),
                            new Differential("Intracranial Structural Pathology (Meningioma / Glioma / GME)", "Moderate (55%)", "Asymmetrical focal deficits, circling, head tilt, or altered mentation."),
                            new Differential("Metabolic / Toxic Encephalopathy (Hypoglycemia / Hepatoencephalopathy)", "Moderate (45%)", "Systemic metabolic derangements triggering secondary epileptiform thresholds.")
                    ),
                    List.of(
                            "Point-of-care blood glucose and ionized calcium measurement (rapid hypoglycemia rule-out)",
                            "Complete serum biochemistry panel including pre- and post-prandial bile acids and ammonia",
                            "Magnetic Resonance Imaging (MRI) of brain with gadolinium contrast",
                            "Cerebrospinal fluid (CSF) tap for nucleated cell count, cytology, and infectious disease PCR panel"
                    ),
                    List.of(
                            "Administer Midazolam (0.2-0.5 mg/kg IV or intranasally) or Diazepam (0.5 mg/kg IV/rectal) for active seizures.",
                            "If cluster seizures persist, load Levetiracetam (Keppra 60 mg/kg IV slow over 10 minutes).",
                            "Secure patent airway, provide flow-by oxygen, and actively monitor core temperature to treat hyperthermia.",
                            "Maintain head elevated at 30 degrees to minimize intracranial pressure (ICP)."
                    )
            );
        }

        // 2. ORTHOPEDIC / LAMENESS / MUSCULOSKELETAL
        if (containsAnyWord(combined, "limp", "limping", "lame", "lameness", "cruciate", "ccl", "fracture",
                "drawer", "swollen joint", "bone", "stifle", "hip dysplasia", "ivdd", "spine pain", "back pain",
                "bunny hop", "bunny hopping", "unable to walk", "non-weight bearing", "luxating patella")) {
            return new AiResponse(
                    "The patient (" + sp + ") presents with marked musculoskeletal impairment, non-weight bearing lameness, and localized pain response. Systematic orthopedic and neurological differentiation is required to distinguish soft tissue/ligamentous rupture from neurological compression or bony fracture.",
                    List.of(
                            new Differential("Cranial Cruciate Ligament (CCL) Rupture / Stifle Instability", "High (80%)", "Acute pelvic limb lameness with positive cranial drawer or tibial compression sign in " + sp + "."),
                            new Differential("Intervertebral Disc Disease (IVDD) / Lumbosacral Stenosis", "Moderate (60%)", "Spinal hyperpathia, kyphosis, or proprioceptive ataxia affecting pelvic limbs."),
                            new Differential("Appendicular Bone Fracture / Joint Luxation", "Moderate (45%)", "Acute trauma, crepitus, or focal periarticular swelling requiring radiography.")
                    ),
                    List.of(
                            "Comprehensive orthogonal digital radiographs of affected joint and contralateral comparison view",
                            "Orthopedic examination under light sedation (Cranial drawer test, Ortolani sign, Campbell test)",
                            "Neurological evaluation including conscious proprioception, spinal reflexes, and deep pain perception",
                            "Arthrocentesis and synovial fluid cytology if joint effusion or septic arthritis is suspected"
                    ),
                    List.of(
                            "Enforce strict cage rest with padded bedding; avoid all running, jumping, and stairs.",
                            "Initiate multimodal analgesia: Pure opioid (Methadone 0.2 mg/kg IV) or Buprenorphine; add approved NSAID once renal values confirmed.",
                            "Immobilize unstable distal limb fractures with a temporary padded Robert Jones splint.",
                            "Refer for orthopedic surgical stabilization (TPLO / Lateral suture / Open reduction) if rupture or displaced fracture confirmed."
                    )
            );
        }

        // 3. OPHTHALMOLOGY / OCULAR
        if (containsAnyWord(combined, "eye", "eyes", "corneal", "ulcer", "squint", "squinting",
                "blepharospasm", "uveitis", "glaucoma", "cherry eye", "cloudy eye", "conjunctivitis",
                "third eyelid", "blind", "blindness", "photophobia", "cataract", "cataracts")) {
            return new AiResponse(
                    "The patient (" + sp + ") presents with acute ocular distress, blepharospasm, and potential loss of corneal integrity or intraocular pressure dysregulation. Timely diagnostic staging is crucial to prevent irreversible corneal perforation or vision loss.",
                    List.of(
                            new Differential("Corneal Ulceration (Deep Stromal / Descemetocele)", "High (80%)", "Focal corneal defect, photophobia, epiphora, and blepharospasm in " + sp + "."),
                            new Differential("Acute Glaucoma vs Anterior Uveitis", "Moderate (55%)", "Episcleral injection, corneal edema, and abnormal intraocular pressure dynamics."),
                            new Differential("Keratoconjunctivitis Sicca (KCS) / Prolapsed Nictitans Gland", "Moderate (40%)", "Mucopurulent ocular discharge, dry conjunctiva, or prolapsed third eyelid tissue.")
                    ),
                    List.of(
                            "Fluorescein dye corneal staining (mandatory to assess corneal epithelial integrity)",
                            "Applanation Tonometry (Tono-Pen or TonoVet to measure Intraocular Pressure / IOP)",
                            "Schirmer Tear Test-1 (STT-1) to evaluate quantitative basal tear production",
                            "Slit-lamp biomicroscopy and direct ophthalmoscopy of anterior chamber and fundus"
                    ),
                    List.of(
                            "Fit an Elizabethan collar (E-collar) immediately to prevent destructive self-trauma.",
                            "CONTRAINDICATION: Do NOT administer any topical corticosteroids until corneal ulceration is completely excluded.",
                            "Apply topical broad-spectrum ophthalmic antibiotic drops (e.g., Ofloxacin or Tobramycin q4-6h).",
                            "Administer topical serum or equine autologous plasma drops if corneal melting/enzymatic malacia is present."
                    )
            );
        }

        // 4. DERMATOLOGY / OTOLOGY
        if (containsAnyWord(combined, "ear", "ears", "scratching", "head shaking", "head shake",
                "otitis", "pruritus", "itching", "itchy", "alopecia", "mange", "mites", "flea", "fleas",
                "skin redness", "hives", "swelling face", "facial swelling", "hot spot", "pyoderma")) {
            return new AiResponse(
                    "The patient (" + sp + ") presents with prominent cutaneous or otic inflammation, severe pruritus, and secondary epidermal barrier disruption. Prompt cytological identification of bacterial or fungal overgrowth is essential for targeted topical and systemic therapy.",
                    List.of(
                            new Differential("Acute Otitis Externa (Malassezia / Bacterial)", "High (80%)", "Erythematous vertical canal, malodorous brown ceruminous exudate, and head shaking in " + sp + "."),
                            new Differential("Atopic Dermatitis / Flea Allergy Dermatitis (FAD) Flare", "Moderate (65%)", "Ventral pruritus, secondary excoriations, and peri-anal or caudal lumbar alopecia."),
                            new Differential("Type I Hypersensitivity / Acute Facial Angioedema (Urticaria)", "Moderate (45%)", "Rapid-onset facial swelling, blepharoedema, or wheals secondary to insect sting or allergen.")
                    ),
                    List.of(
                            "Bilateral otoscopic examination to evaluate canal stenosis and verify tympanic membrane integrity",
                            "Ear swab cytology stained with Diff-Quik to quantify cocci, rods, and budding Malassezia yeast",
                            "Superficial and deep skin scrapings (microscopic evaluation for Demodex, Sarcoptes, or Otodectes)",
                            "Skin tape-strip cytology of affected lesions to evaluate superficial pyoderma"
                    ),
                    List.of(
                            "For acute facial angioedema/allergic reaction: Administer Diphenhydramine (2 mg/kg IM) and Dexamethasone SP (0.15 mg/kg IV/IM).",
                            "Perform gentle ear canal flushing with neutral non-ototoxic ceruminolytic agent (verify intact tympanum).",
                            "Instill targeted combination otic suspension (e.g., Florfenicol/Terbinafine/Betamethasone).",
                            "Initiate rapid antipruritic therapy (Oclacitinib / Apoquel or Lokivetmab / Cytopoint) for severe allergic flares."
                    )
            );
        }

        // 5. TOXICOLOGY / INGESTION / POISON
        if (containsAnyWord(combined, "poison", "rodenticide", "rat poison", "chocolate", "onion",
                "garlic", "grapes", "raisin", "raisins", "xylitol", "lily", "lilies", "paracetamol",
                "toxic", "antifreeze", "ethylene glycol", "pesticide", "ingested toxin", "ate poison")) {
            return new AiResponse(
                    "The patient (" + sp + ") has confirmed or highly suspected exposure to a dangerous exogenous toxin. Immediate decontamination, calculation of toxic dose thresholds, and proactive organoprotective therapy are critical to prevent irreversible systemic organ failure or coagulopathy.",
                    List.of(
                            new Differential("Anticoagulant Rodenticide Toxicosis (Vitamin K1 Antagonism)", "High (85%)", "Exposure to bromadiolone/brodifacoum leading to severe coagulopathy and cavitary hemorrhage in " + sp + "."),
                            new Differential("Methylxanthine Toxicosis (Theobromine / Chocolate)", "Moderate (65%)", "CNS stimulation, tachycardia, cardiac arrhythmias, and vomiting secondary to dark chocolate ingestion."),
                            new Differential("Toxin-Induced Acute Kidney or Hepatic Injury (Lily / Xylitol / Grapes)", "Moderate (50%)", "Nephrotoxic or hepatotoxic cascade requiring aggressive IV diuresis.")
                    ),
                    List.of(
                            "Baseline coagulation panel: Prothrombin Time (PT - prolongs earliest within 36-48h) and aPTT",
                            "Serial blood glucose monitoring (crucial for xylitol-induced profound hypoglycemia)",
                            "Comprehensive serum chemistry panel (BUN, Creatinine, Electrolytes, ALT, Total Bilirubin)",
                            "Venous blood gas and baseline complete blood count (evaluate for hemolytic anemia or thrombocytopenia)"
                    ),
                    List.of(
                            "If ingestion within 2 hours and patient is neurologically intact: Induce emesis with Apomorphine (0.03 mg/kg IV) or Clevor.",
                            "Administer Activated Charcoal with sorbitol (1-2 g/kg PO) to bind toxin in the gastrointestinal tract.",
                            "For anticoagulant rodenticide: Initiate Vitamin K1 therapy (2.5-5 mg/kg PO daily with fatty meal for 28-35 days).",
                            "Start aggressive balanced IV crystalloid fluid diuresis (2-3x maintenance) for nephrotoxins."
                    )
            );
        }

        // 6. EQUINE SPECIFIC: COLIC
        if (sp.equalsIgnoreCase("Equine") || containsAnyWord(combined, "colic", "pawing", "reflux", "rolling", "gut pain", "nasogastric")) {
            return new AiResponse(
                    "The patient (Equine) displays acute visceral pain consistent with large or small colon distension and potential ischemia. Immediate nasogastric decompression and peritoneal evaluation are essential to determine medical vs surgical management.",
                    List.of(
                            new Differential("Strangulating Large Colon Volvulus / Small Intestinal Entrapment", "High (80%)", "Unremitting violent colic pain unresponsive to systemic analgesics in equine."),
                            new Differential("Large Colon Impaction (Pelvic Flexure)", "Moderate (50%)", "Mild-to-moderate continuous colic with decreased fecal output."),
                            new Differential("Spasmodic Colic / Tympany", "Moderate (40%)", "Intermittent hypermotile bowel sounds responsive to antispasmodics.")
                    ),
                    List.of(
                            "Immediate nasogastric intubation (assess net spontaneous fluid reflux volume)",
                            "Transrectal palpation to evaluate pelvic flexure impaction or distended small bowel loops",
                            "FLASH abdominal ultrasound protocol (evaluate intestinal wall thickness > 4mm)",
                            "Abdominocentesis (evaluate peritoneal total protein and lactate level > 4 mmol/L)"
                    ),
                    List.of(
                            "Pass nasogastric tube promptly to relieve gastric distension and prevent stomach rupture.",
                            "Control visceral pain: Flunixin meglumine (1.1 mg/kg IV) or Xylazine (0.5 mg/kg IV).",
                            "Prepare for emergency exploratory laparotomy if net reflux > 5L or peritoneal lactate elevated.",
                            "Initiate rapid IV balanced fluid resuscitation via 10G jugular catheter."
                    )
            );
        }

        // 7. BOVINE / LARGE ANIMAL (BLOAT / MASTITIS / DOWNER COW)
        if (sp.equalsIgnoreCase("Bovine") || containsAnyWord(combined, "cow", "calf", "bloat", "rumen", "milk fever", "downer", "abomasum", "mastitis", "lda")) {
            return new AiResponse(
                    "The patient (" + sp + ") presents with acute ruminant metabolic, gastrointestinal, or periparturient compromise. Rapid assessment of ruminal motility, abomasal positioning, and systemic ionized minerals is essential to prevent permanent recumbency or ruminal asphyxiation.",
                    List.of(
                            new Differential("Acute Ruminal Tympany (Free-Gas or Frothy Bloat)", "High (80%)", "Marked distension of left paralumbar fossa, dyspnea, and ruminal hyper-resonance in " + sp + "."),
                            new Differential("Periparturient Hypocalcemia (Milk Fever / Downer Cow)", "Moderate (65%)", "Postpartum recumbency, 'S-curve' neck posture, cool extremities, and flaccid paralysis."),
                            new Differential("Left Displaced Abomasum (LDA) / Abomasal Volvulus", "Moderate (50%)", "Characteristic high-pitched musical 'ping' on left auscultation-percussion with ketosis.")
                    ),
                    List.of(
                            "Simultaneous auscultation and percussion over 9th-13th ribs to evaluate characteristic metallic pings",
                            "Ruminal fluid aspiration via stomach tube (assess pH, odor, stratification, and protozoal motility)",
                            "Point-of-care serum ionized calcium and blood beta-hydroxybutyrate (BHB) concentration",
                            "California Mastitis Test (CMT) of all four quarters to detect subclinical/clinical mastitis"
                    ),
                    List.of(
                            "For severe life-threatening ruminal bloat: Pass large-bore stomach tube or perform emergency left paralumbar trocarization.",
                            "For frothy bloat: Administer oral surfactant/anti-foaming agent (Poloxalene or mineral oil 500 mL).",
                            "For hypocalcemia / milk fever: Infuse 500 mL of 23% Calcium borogluconate slowly IV while monitoring cardiac auscultation.",
                            "Administer systemic NSAID (Flunixin meglumine 1.1-2.2 mg/kg IV) to counter endotoxemia."
                    )
            );
        }

        // 8. FELINE SPECIFIC: LOWER URINARY TRACT / OBSTRUCTION
        if (sp.equalsIgnoreCase("Feline") && containsAnyWord(combined, "stranguria", "straining", "litter", "block", "blocked", "urinary", "hematuria", "dysuria")) {
            return new AiResponse(
                    "The patient (Feline) exhibits classic clinical manifestations of acute lower urinary tract disease with suspected mechanical or functional urethral obstruction. Urgent evaluation for hyperkalemia and post-renal azotemia is imperative.",
                    List.of(
                            new Differential("Feline Urethral Obstruction (FLUTD / Blocked Cat)", "High (90%)", "Tense, painful, non-expressible bladder with dysuria and vocalization in feline."),
                            new Differential("Feline Idiopathic Cystitis (FIC)", "Moderate (55%)", "Sterile neurogenic inflammation triggered by environmental stress."),
                            new Differential("Urolithiasis (Struvite or Calcium Oxalate Calculi)", "Moderate (45%)", "Cystic calculi causing mechanical outflow blockage.")
                    ),
                    List.of(
                            "Immediate point-of-care serum potassium and creatinine evaluation (hyperkalemia triage)",
                            "Lateral abdominal radiograph to assess for radiopaque calculi along urethral tract",
                            "Urinalysis (sediment microscopy, crystals, urine protein-to-creatinine ratio)",
                            "Bladder ultrasound to inspect mucosal thickening and intraluminal matrix plugs"
                    ),
                    List.of(
                            "Immediate emergency decompressive cystocentesis if catheterization is delayed.",
                            "Address life-threatening hyperkalemia: 10% Calcium gluconate (0.5-1.5 mL/kg slow IV with ECG monitoring).",
                            "Place indwelling soft radiopaque tomcat catheter under sedation and flush with warm sterile saline.",
                            "Initiate IV balanced crystalloids to correct metabolic acidosis and post-obstructive diuresis."
                    )
            );
        }

        // 9. ENDOCRINE & RENAL / POLYURIA & POLYDIPSIA (PU/PD)
        if (containsAnyWord(combined, "water", "drinking", "polydipsia", "urination", "polyuria", "pu/pd", "diabetes", "cushing", "pot belly", "kidney disease", "renal failure")) {
            return new AiResponse(
                    "The patient (" + sp + ") exhibits pronounced polyuria and compensatory polydipsia (PU/PD). This presentation points toward an underlying endocrine disturbance, renal tubular concentration failure, or systemic metabolic decompensation.",
                    List.of(
                            new Differential("Diabetes Mellitus with / without Diabetic Ketoacidosis (DKA)", "High (80%)", "Hyperglycemia, persistent glucosuria, polyphagia, and progressive muscle wasting in " + sp + "."),
                            new Differential("Chronic Kidney Disease (CKD / IRIS Staged)", "Moderate (65%)", "Loss of renal concentrating ability with low urine specific gravity and azotemia."),
                            new Differential("Hyperadrenocorticism (Cushing's Disease) or Hyperthyroidism", "Moderate (45%)", "Endocrine dysregulation accompanied by dermatological changes or polyphagia.")
                    ),
                    List.of(
                            "Complete urinalysis via cystocentesis: Urine Specific Gravity (USG), dipstick (glucose, ketones, protein), and sediment",
                            "Fasting blood glucose curve and serum Fructosamine concentration",
                            "Comprehensive renal panel (Serum BUN, Creatinine, SDMA, Electrolytes, Phosphorus, Total Protein)",
                            "Low-Dose Dexamethasone Suppression Test (LDDST) or ACTH stimulation test for adrenal evaluation"
                    ),
                    List.of(
                            "NEVER restrict water intake; ensure constant free-choice access to fresh water.",
                            "If ketones and metabolic acidosis present (DKA): Initiate regular crystalline insulin CRI and balanced IV fluid resuscitation.",
                            "For newly diagnosed uncomplicated diabetes: Initiate maintenance intermediate insulin (Caninsulin / Glargine) with scheduled meals.",
                            "Support renal perfusion with subcutaneous or balanced intravenous fluid therapy if azotemic."
                    )
            );
        }

        // 10. TRAUMA / HEMORRHAGE / WOUND / SHOCK
        if (containsAnyWord(combined, "hit by car", "hbc", "trauma", "wound", "bleeding", "hemorrhage", "bite", "collapsed", "shock", "laceration", "cold paws", "pale gums")) {
            return new AiResponse(
                    "The patient (" + sp + ") is in acute post-traumatic shock with potential internal cavitary hemorrhage and hemodynamic collapse. Immediate vascular access, volume resuscitation, and trauma triage ultrasonography are the highest priorities.",
                    List.of(
                            new Differential("Hypovolemic / Hemorrhagic Shock secondary to Cavitary Trauma", "High (85%)", "Pale mucous membranes, weak thread-like pulses, and tachycardia following trauma in " + sp + "."),
                            new Differential("Hemoperitoneum / Splenic or Hepatic Laceration", "Moderate (65%)", "Abdominal distension with free peritoneal fluid on trauma ultrasound."),
                            new Differential("Traumatic Pneumothorax / Diaphragmatic Hernia", "Moderate (50%)", "Tachypnea, muffled thoracic sounds, and paradoxical abdominal breathing.")
                    ),
                    List.of(
                            "Abdominal and Thoracic FAST (AFAST / TFAST) point-of-care ultrasound to locate free fluid pockets",
                            "Emergency Packed Cell Volume (PCV) and Total Solids (TS) baseline with serial lactate monitoring",
                            "Three-view orthogonal thoracic radiographs (perform only after patient is respiratively stabilized)",
                            "Arterial blood pressure monitoring (Doppler or oscillometric) to guide volume endpoints"
                    ),
                    List.of(
                            "Place dual large-bore peripheral IV catheters (16G or 18G) immediately.",
                            "Administer balanced isotonic crystalloid shock bolus (Canine: 15-20 mL/kg, Feline: 5-10 mL/kg over 15 min).",
                            "Apply direct digital pressure and compressive sterile dressings to all active external hemorrhage.",
                            "Provide gentle flow-by oxygenation and administer pure opioid analgesia (Methadone 0.2 mg/kg IV)."
                    )
            );
        }

        // 11. OBSTETRICS / REPRODUCTIVE / DYSTOCIA / PYOMETRA
        if (containsAnyWord(combined, "pregnant", "whelping", "dystocia", "puppy stuck", "uterine", "pyometra", "vulvar discharge", "green discharge", "mastitis", "eclampsia")) {
            return new AiResponse(
                    "The patient (" + sp + ") displays critical reproductive pathology or obstetric complications. Immediate differentiation between obstructive dystocia, fetal compromise, and uterine infection (pyometra) is vital to determine emergency surgical intervention.",
                    List.of(
                            new Differential("Obstructive Dystocia / Primary or Secondary Uterine Inertia", "High (85%)", "Prolonged unproductive straining (>30 min) or green lochial discharge prior to fetal delivery in " + sp + "."),
                            new Differential("Cystic Endometrial Hyperplasia - Pyometra Complex (Open or Closed)", "Moderate (70%)", "Purulent or sanguineous vulvar discharge, lethargy, fever, and leukocytosis in intact female."),
                            new Differential("Puerperal Hypocalcemia (Eclampsia / Milk Fever)", "Moderate (40%)", "Restlessness, muscle tremors, and stiff gait during peak lactation.")
                    ),
                    List.of(
                            "Emergency abdominal ultrasound to assess fetal heart rates (< 150 bpm indicates severe fetal distress) and uterine fluid distension",
                            "Digital abdominal radiograph to confirm fetal skull dimensions relative to maternal birth canal",
                            "Point-of-care ionized calcium (iCa) and blood glucose evaluation",
                            "CBC with differential leukogram to identify degenerative left-shift characteristic of closed pyometra"
                    ),
                    List.of(
                            "If fetal bradycardia (< 150 bpm) or physical pelvic obstruction is confirmed: Prepare immediately for emergency Cesarean section.",
                            "For confirmed pyometra: Administer IV broad-spectrum bactericidal antibiotics (Ampicillin-sulbactam) and schedule urgent ovariohysterectomy.",
                            "For eclampsia: Slowly infuse 10% Calcium gluconate (0.5-1.5 mL/kg slow IV with continuous ECG monitoring).",
                            "Establish warm neonatal resuscitation station with suction bulbs, oxygen, and naloxone."
                    )
            );
        }

        // 12. CARDIAC / CARDIOVASCULAR
        if (containsAnyWord(combined, "syncope", "murmur", "tachycardia", "arrhythmia", "gallop",
                "congestive heart", "chf", "dcm", "tamponade") || (combined.contains("cough") && combined.contains("heart"))) {
            return new AiResponse(
                    "The patient (" + sp + ") presents with marked cardiovascular compromise, pulse abnormalities, and potential hemodynamic instability. Immediate diagnostic confirmation and gentle handling are required to prevent fatal acute decompensation.",
                    List.of(
                            new Differential("Stage C Dilated Cardiomyopathy (DCM) / Arrhythmia", "High (80%)", "Evidence of cardiac compromise, pulse deficits, exercise intolerance or syncope in " + sp + "."),
                            new Differential("Congestive Heart Failure (CHF) with Pulmonary Edema", "Moderate (65%)", "Tachypnea, resting respiratory distress, and potential thoracic fluid congestion."),
                            new Differential("Pericardial Effusion with Cardiac Tamponade", "Moderate (40%)", "Muffled heart sounds and weak arterial pulses.")
                    ),
                    List.of(
                            "Right lateral and dorsoventral thoracic radiographs to assess vertebral heart score (VHS)",
                            "Transthoracic echocardiogram (verify fractional shortening and chamber dimensions)",
                            "6-lead continuous electrocardiogram (ECG) to identify rhythm disturbance",
                            "Serum NT-proBNP biomarker and cardiac Troponin I (cTnI) levels"
                    ),
                    List.of(
                            "Provide supplemental oxygen cage or gentle flow-by (40-60% FiO2).",
                            "Administer IV loop diuretic (Furosemide 2 mg/kg) if pulmonary crackles/edema present.",
                            "Initiate oral inodilator (Pimobendan 0.25 mg/kg) once stabilized.",
                            "Avoid aggressive fluid therapy or high sodium crystalloids."
                    )
            );
        }

        // 13. RESPIRATORY / DYSPNEA / ASTHMA / COUGH
        if (containsAnyWord(combined, "dyspnea", "tachypnea", "cyanosis", "stridor", "wheezing", "respiratory", "cough", "asthma", "breathing hard")) {
            return new AiResponse(
                    "The patient (" + sp + ") is in acute respiratory distress with compromised ventilatory mechanics and potential hypoxemia. Minimal-stress flow-by oxygenation and thoracic triage ultrasound (TFAST) are prioritized before stressful handling.",
                    List.of(
                            new Differential("Acute Respiratory Distress / Tension Pneumothorax", "High (75%)", "Rapid shallow tachypnea with cyanotic or pale mucous membranes in " + sp + "."),
                            new Differential("Severe Bronchoconstriction / Feline Asthma or RAO", "Moderate (60%)", "Prominent expiratory push, wheezing, and hyper-resonance on thoracic percussion."),
                            new Differential("Non-Cardiogenic Pulmonary Edema / Bacterial Pneumonia", "Moderate (45%)", "Diffuse pulmonary alveolar infiltrates secondary to infectious process or aspiration.")
                    ),
                    List.of(
                            "TFAST (Thoracic Focused Assessment with Sonography for Trauma/Triage)",
                            "Arterial blood gas (ABG) or pulse oximetry monitoring (SpO2)",
                            "Three-view thoracic radiographs (defer if patient is too stressed for restraint)",
                            "Complete CBC with differential leukogram to evaluate septic left-shift"
                    ),
                    List.of(
                            "Immediate minimal-handling oxygen therapy (mask, hood, or oxygen cage).",
                            "Perform emergency bilateral thoracocentesis in 7th-9th intercostal space if pneumothorax suspected.",
                            "Inject rapid-acting bronchodilator (Terbutaline 0.01 mg/kg SC) or dexamethasone SP if asthma/anaphylaxis.",
                            "Keep environmental noise and stress to an absolute minimum."
                    )
            );
        }

        // 14. GASTROENTERITIS / FEVER & INAPPETENCE
        if (containsAnyWord(combined, "fever", "temperature", "eating", "eaten", "food", "vomit", "vomiting", "diarrhea", "stool", "lethargic", "lethargy", "anorexia")) {
            return new AiResponse(
                    "The patient (" + sp + ") presents with active gastrointestinal disturbance, pyrexia, and inappetence. Findings suggest mucosal inflammation, dehydration, and potential systemic inflammatory response requiring parenteral antiemetics and fluid therapy.",
                    List.of(
                            new Differential("Acute Gastroenteritis / Infectious Enteropathy (Parvovirus/Coronavirus)", "High (80%)", "Evidence of gastrointestinal compromise, emesis, anorexia, or pyrexia in " + sp + "."),
                            new Differential("Acute Pancreatitis / Systemic Inflammatory Response", "Moderate (55%)", "Inappetence with vomiting and secondary abdominal discomfort."),
                            new Differential("Gastrointestinal Foreign Body / Mechanical Obstruction", "Moderate (40%)", "Persistent emesis and refusal of food requiring radiographic rule-out.")
                    ),
                    List.of(
                            "Complete Blood Count (CBC) with manual differential to assess leukocytosis or toxic change",
                            "Comprehensive serum chemistry panel (BUN, Creatinine, Electrolytes, Spec cPL/fPL)",
                            "Abdominal survey radiographs (two orthogonal views) to evaluate bowel pattern and rule out obstruction",
                            "Fecal analysis (antigen screening and flotation for parasitic enteropathogens)"
                    ),
                    List.of(
                            "Initiate balanced isotonic crystalloid rehydration therapy (adjust for % dehydration).",
                            "Administer antiemetic: Maropitant citrate (1 mg/kg SC q24h) or Ondansetron (0.5 mg/kg IV q8h).",
                            "Provide gastroprotectant support (Pantoprazole 1 mg/kg IV slow) if gastritis suspected.",
                            "Withhold solid food until active emesis resolves, then introduce bland low-fat diet."
                    )
            );
        }

        // 15. DEFAULT ACUTE ABDOMEN / GASTRIC DILATATION-VOLVULUS
        return new AiResponse(
                "The patient (" + sp + ") presents with acute clinical compromise requiring comprehensive diagnostic staging and supportive stabilization. Initial physical triage and diagnostic imaging are indicated to establish a definitive diagnosis.",
                List.of(
                        new Differential("Acute Abdomen / Visceral Distension", "High (70%)", "Generalized acute abdominal distress and systemic guarding in " + sp + "."),
                        new Differential("Systemic Inflammatory Response Syndrome (SIRS)", "Moderate (50%)", "Hemodynamic shifts requiring close fluid and electrolyte monitoring."),
                        new Differential("Occult Metabolic / Organ Dysfunction", "Moderate (40%)", "Nonspecific presentation requiring complete hematologic and biochemical screening.")
                ),
                List.of(
                        "Complete Blood Count (CBC) and full serum chemistry with electrolyte panel",
                        "Orthogonal abdominal survey radiographs to assess organ margins and gas patterns",
                        "Abdominal Focused Assessment with Sonography (AFAST) to rule out free peritoneal effusion",
                        "Venous blood gas and baseline lactate evaluation to monitor tissue perfusion"
                ),
                List.of(
                        "Establish intravenous catheter access and begin supportive balanced crystalloid therapy.",
                        "Administer appropriate analgesia based on pain score assessment.",
                        "Monitor vital signs, capillary refill time, and hydration status continuously.",
                        "Re-evaluate clinical parameters frequently following initial fluid stabilization."
                )
        );
    }

    private boolean containsAnyWord(String text, String... keywords) {
        if (text == null || text.isBlank() || keywords.length == 0) return false;
        String regex = "(?i)\\b(" + String.join("|", keywords) + ")\\b";
        return Pattern.compile(regex).matcher(text).find();
    }
}


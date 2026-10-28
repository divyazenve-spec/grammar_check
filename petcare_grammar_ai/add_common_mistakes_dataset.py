import csv
import os

mistake_pairs = [
    # 1. Animal Typos (dod -> dog, cta -> cat, pupy -> puppy, kitn -> kitten)
    ("My dod got diaria.", "My dog has diarrhea."),
    ("My dod got diarrhea.", "My dog has diarrhea."),
    ("My dod got fever.", "My dog has a fever."),
    ("My dod got vomit.", "My dog has vomited."),
    ("My dod got vomiting.", "My dog has been vomiting."),
    ("My dod not eating.", "My dog is not eating."),
    ("My dod not eating food.", "My dog is not eating food."),
    ("My dod not drinking water.", "My dog is not drinking water."),
    ("My dod not sleeping.", "My dog is not sleeping."),
    ("The dod got hurt.", "The dog was injured."),
    ("The dod leg bleeding.", "The dog's leg is bleeding."),
    ("The dod leg swollen.", "The dog's leg is swollen."),
    ("My dod shivering bad.", "My dog is shivering badly."),
    ("My dod coughing heavily.", "My dog is coughing heavily."),
    ("My cta got diaria.", "My cat has diarrhea."),
    ("My cta got fever.", "My cat has a fever."),
    ("My cta not eating.", "My cat is not eating."),
    ("The cta vomit yellow fluid.", "The cat vomited yellow fluid."),
    ("My pupy got diaria.", "My puppy has diarrhea."),
    ("My pupy got fever.", "My puppy has a fever."),
    ("My pupy not drinking water.", "My puppy is not drinking water."),
    ("My pupy crying when touch.", "My puppy cries when touched."),

    # 2. "got <condition>" Colloquial Phrasing
    ("My dog got diaria.", "My dog has diarrhea."),
    ("The dog got diaria.", "The dog has diarrhea."),
    ("Dog got diaria.", "The dog has diarrhea."),
    ("Cat got diaria.", "The cat has diarrhea."),
    ("My cat got diaria.", "My cat has diarrhea."),
    ("Puppy got diaria.", "The puppy has diarrhea."),
    ("My puppy got diaria.", "My puppy has diarrhea."),
    ("My dog got diarrhea.", "My dog has diarrhea."),
    ("The dog got diarrhea.", "The dog has diarrhea."),
    ("Dog got fever.", "The dog has a fever."),
    ("My dog got fever.", "My dog has a fever."),
    ("Cat got fever.", "The cat has a fever."),
    ("My cat got fever.", "My cat has a fever."),
    ("Puppy got fever.", "The puppy has a fever."),
    ("My dog got high fever.", "My dog has a high fever."),
    ("My cat got cough.", "My cat has a cough."),
    ("Dog got cough.", "The dog has a cough."),
    ("Dog got loose motion.", "The dog has diarrhea."),
    ("My dog got loose motion.", "My dog has diarrhea."),
    ("Cat got loose motion.", "The cat has diarrhea."),
    ("Puppy got loose motion.", "The puppy has diarrhea."),
    ("My dog got vomit.", "My dog has vomited."),
    ("The dog got vomit.", "The dog has vomited."),
    ("My dog got vomiting.", "My dog has been vomiting."),
    ("My cat got vomiting.", "My cat has been vomiting."),
    ("Puppy got vomiting.", "The puppy has been vomiting."),
    ("My dog got ear infection.", "My dog has an ear infection."),
    ("Cat got ear infection.", "The cat has an ear infection."),
    ("My dog got eye infection.", "My dog has an eye infection."),
    ("Cat got eye infection.", "The cat has an eye infection."),
    ("My puppy got tick.", "My puppy has ticks."),
    ("Dog got ticks all over body.", "The dog has ticks all over its body."),
    ("Cat got fleas.", "The cat has fleas."),
    ("My dog got skin allergy.", "My dog has a skin allergy."),
    ("My dog got wound on leg.", "My dog has a wound on its leg."),
    ("Dog got injury after accident.", "The dog was injured after an accident."),
    ("My dog got swollen abdomen.", "My dog's abdomen is swollen."),
    ("Cat got swollen belly.", "The cat's abdomen is swollen."),
    ("My puppy got seizure.", "My puppy has had a seizure."),
    ("Dog got fits today.", "The dog had a seizure today."),
    ("My dog got cold and shivering.", "My dog has a cold and is shivering."),
    ("My dog got bloody stool.", "My dog has blood in its stool."),
    ("Dog got blood in motion.", "The dog has blood in its stool."),
    ("Cat got blood in urine.", "The cat has blood in its urine."),

    # 3. "got <condition> + Duration"
    ("My dod got diaria from yesterday.", "My dog has had diarrhea since yesterday."),
    ("My dog got diaria for 3 days.", "My dog has had diarrhea for 3 days."),
    ("My dog got diaria from 2 days.", "My dog has had diarrhea for 2 days."),
    ("Dog got diaria from yesterday.", "The dog has had diarrhea since yesterday."),
    ("Dog got diaria for 3 days.", "The dog has had diarrhea for 3 days."),
    ("Cat got diaria since morning.", "The cat has had diarrhea since this morning."),
    ("My dod got fever from 2 days.", "My dog has had a fever for 2 days."),
    ("Dog got fever from yesterday.", "The dog has had a fever since yesterday."),
    ("Cat got fever from 3 days.", "The cat has had a fever for 3 days."),
    ("My cat got vomiting since morning.", "My cat has been vomiting since this morning."),
    ("Puppy got diaria from last night.", "The puppy has had diarrhea since last night."),
    ("My dog got loose motion for 2 days.", "My dog has had diarrhea for 2 days."),
    ("Dog got shivering from morning.", "The dog has been shivering since morning."),

    # 4. Common Phonetic Misspellings
    ("My dog have diaria.", "My dog has diarrhea."),
    ("The dog have diaria.", "The dog has diarrhea."),
    ("Dog have diaria.", "The dog has diarrhea."),
    ("Cat have diaria.", "The cat has diarrhea."),
    ("Puppy have diaria.", "The puppy has diarrhea."),
    ("Dog vomitng food.", "The dog is vomiting food."),
    ("Cat vomitng yellow fluid.", "The cat is vomiting yellow fluid."),
    ("Puppy vomitng from morning.", "The puppy has been vomiting since morning."),
    ("Dog is lethergic and not eating.", "The dog is lethargic and is not eating."),
    ("Cat is lethergic from yesterday.", "The cat has been lethargic since yesterday."),
    ("Dog have fevr and coughng.", "The dog has a fever and is coughing."),
    ("Puppy shiverring and crying.", "The puppy is shivering and crying."),
    ("Dog leg swolen after jump.", "The dog's leg is swollen after jumping."),
    ("Cat eye have infectaton.", "The cat's eye has an infection."),
    ("Dog diffculty breathng.", "The dog has difficulty breathing."),
    ("Dog breathng fast.", "The dog is breathing rapidly."),
    ("Cat scratchng ear continuous.", "The cat is scratching its ears continuously."),
    ("Dog bleadng from paw.", "The dog is bleeding from its paw."),
    ("Dog abdonen is hard.", "The dog's abdomen is firm."),

    # 5. Multi-Sentence Composite Complaint Scenarios
    ("My dod got diaria. It not drinking water for 3 days. And more tired.",
     "My dog has diarrhea. It has not been drinking water for 3 days. He is also more tired."),
    ("My dod got diaria. Not eating food from yesterday.",
     "My dog has diarrhea. He has not been eating food since yesterday."),
    ("My dod got diaria and vomit. And very weak.",
     "My dog has diarrhea and has vomited. He is also very weak."),
    ("Dog got fever from 2 days. And more tired.",
     "The dog has had a fever for 2 days. He is also more tired."),
    ("My cat got diaria and not eating food. And more dull.",
     "My cat has diarrhea and is not eating food. She is also more dull."),
    ("My pupy got loose motion. Not active from morning.",
     "My puppy has diarrhea. He has not been active since morning."),
    ("My dod got fever and shivering. And crying in pain.",
     "My dog has a fever and is shivering. He is also crying in pain.")
]

csv_path = os.path.join(os.path.dirname(__file__), "training_data.csv")
existing = set()

if os.path.exists(csv_path):
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader, None)
        for r in reader:
            if r:
                existing.add(r[0].strip().lower())

added = 0
with open(csv_path, "a", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    for inp, tgt in mistake_pairs:
        if inp.strip().lower() not in existing:
            writer.writerow([inp.strip(), tgt.strip()])
            existing.add(inp.strip().lower())
            added += 1

print(f"Added {added} realistic complaint mistake pairs to {csv_path}!")

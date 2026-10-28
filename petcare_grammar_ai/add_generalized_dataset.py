import csv
import os

generalized_pairs = [
    # Generalized Pet Name Introductions (Diverse names: Max, Bella, Charlie, Luna, Milo, Rocky, Daisy, Buddy, Oliver, Leo, Simba, Coco, Buster, Toby)
    ("My dog name is Max.", "My dog's name is Max."),
    ("My dog's name is Max.", "My dog's name is Max."),
    ("Dog name is Max.", "The dog's name is Max."),
    ("My cat name is Bella.", "My cat's name is Bella."),
    ("My cat's name is Bella.", "My cat's name is Bella."),
    ("Cat name is Bella.", "The cat's name is Bella."),
    ("My puppy name is Charlie.", "My puppy's name is Charlie."),
    ("My puppy's name is Charlie.", "My puppy's name is Charlie."),
    ("Puppy name is Charlie.", "The puppy's name is Charlie."),
    ("My kitten name is Luna.", "My kitten's name is Luna."),
    ("My kitten's name is Luna.", "My kitten's name is Luna."),
    ("My dog name is Milo.", "My dog's name is Milo."),
    ("My dog's name is Milo.", "My dog's name is Milo."),
    ("My cat name is Daisy.", "My cat's name is Daisy."),
    ("My puppy name is Rocky.", "My puppy's name is Rocky."),
    ("My dog name is Buddy.", "My dog's name is Buddy."),
    ("My cat name is Oliver.", "My cat's name is Oliver."),
    ("My pet name is Leo.", "My pet's name is Leo."),
    ("My pet's name is Leo.", "My pet's name is Leo."),
    ("My dog name is Simba.", "My dog's name is Simba."),
    ("My puppy name is Coco.", "My puppy's name is Coco."),
    ("My dog name is Buster.", "My dog's name is Buster."),
    ("My cat name is Toby.", "My cat's name is Toby."),
    ("His name is Bruno.", "His name is Bruno."),
    ("Her name is Cleo.", "Her name is Cleo."),
    ("His name is Bailey.", "His name is Bailey."),
    ("Her name is Sadie.", "Her name is Sadie."),
    ("Patient name is Duke.", "The patient's name is Duke."),
    ("The patient name is Bear.", "The patient's name is Bear."),

    # Generalized Pronoun & Duration Clinical Actions
    ("It not drinking water for 3 days.", "It has not been drinking water for 3 days."),
    ("It not drinking water from 3 days.", "It has not been drinking water for 3 days."),
    ("It not drink water for 3 days.", "It has not been drinking water for 3 days."),
    ("It not drink water from 3 days.", "It has not been drinking water for 3 days."),
    ("It has not been drinking water for 3 days.", "It has not been drinking water for 3 days."),
    ("He not drinking water for 3 days.", "He has not been drinking water for 3 days."),
    ("He not drinking water from 3 days.", "He has not been drinking water for 3 days."),
    ("He not drink water for 3 days.", "He has not been drinking water for 3 days."),
    ("He not drink water from 2 days.", "He has not been drinking water for 2 days."),
    ("She not eating food for 3 days.", "She has not been eating food for 3 days."),
    ("She not eating food from 3 days.", "She has not been eating food for 3 days."),
    ("She not eat food from 2 days.", "She has not been eating food for 2 days."),
    ("He not eating anything from morning.", "He has not eaten anything since morning."),
    ("She not eating anything since morning.", "She has not eaten anything since morning."),
    ("It not eating food since yesterday.", "It has not been eating food since yesterday."),
    ("He not sleeping from last night.", "He has not been sleeping since last night."),
    ("She not sleeping from yesterday.", "She has not been sleeping since yesterday."),
    ("It not sleeping for 2 days.", "It has not been sleeping for 2 days."),
    ("He not active from 2 days.", "He has not been active for 2 days."),
    ("She not walking from morning.", "She has not been walking since morning."),
    ("He not moving properly today.", "He is not moving properly today."),
    ("It not standing from yesterday.", "It has not been standing since yesterday."),
    ("She vomit 3 times today.", "She has vomited 3 times today."),
    ("He vomit yellow fluid morning.", "He vomited yellow fluid this morning."),
    ("It vomit after eating food.", "It vomited after eating food."),
    ("He have high fever from yesterday.", "He has had a high fever since yesterday."),
    ("She have fever and shivering.", "She has a fever and is shivering."),

    # Sentence Fragments Starting with 'And' & 'Also'
    ("And more tired.", "He is also more tired."),
    ("and more tired.", "He is also more tired."),
    ("And more tired", "He is also more tired."),
    ("And is more tired.", "And is more tired."),
    ("And more weak.", "He is also weaker."),
    ("And more dull.", "He is also more dull."),
    ("And more lethargic.", "He is also more lethargic."),
    ("And very tired.", "He is also very tired."),
    ("And very weak.", "He is also very weak."),
    ("And very dull.", "He is also very dull."),
    ("And very lethargic.", "He is also very lethargic."),
    ("And not active.", "He is also not active."),
    ("And less active.", "He is also less active."),
    ("And not eating.", "He is also not eating."),
    ("And not eating food.", "He is also not eating food."),
    ("And not drinking water.", "He is also not drinking water."),
    ("And feeling sick.", "He is also feeling sick."),
    ("And looking depressed.", "He is also looking depressed."),
    ("And crying in pain.", "He is also crying in pain."),
    ("And crying when touch.", "He also cries when touched."),
    ("And vomiting continuous.", "He has also been vomiting continuously."),
    ("And vomiting repeatedly.", "He has also been vomiting repeatedly."),
    ("And having fever.", "He also has a fever."),
    ("And having high fever.", "He also has a high fever."),
    ("And shaking body.", "He is also shaking."),
    ("And shivering.", "He is also shivering."),
    ("And shivering bad.", "He is also shivering badly."),
    ("And losing weight.", "He has also been losing weight."),
    ("And sleeping all day.", "He is also sleeping all day."),
    ("Also more tired.", "He is also more tired."),
    ("Also very weak.", "He is also very weak."),
    ("Also not eating.", "He is also not eating."),
    ("Also not drinking water.", "He is also not drinking water."),
    ("Also having fever.", "He also has a fever."),
    ("Also vomiting from yesterday.", "He has also been vomiting since yesterday."),
    ("Also dull from morning.", "He has also been dull since morning."),

    # Multi-sentence Composite Clinical Stories
    ("My dog name is Max. He not drinking water for 3 days. And more tired.", 
     "My dog's name is Max. He has not been drinking water for 3 days. He is also more tired."),
    ("My dog's name is Max. He has not been drinking water for 3 days. And more tired.", 
     "My dog's name is Max. He has not been drinking water for 3 days. He is also more tired."),
    ("My cat name is Bella. She not eating food from 2 days. And very weak.", 
     "My cat's name is Bella. She has not been eating food for 2 days. She is also very weak."),
    ("My puppy name is Charlie. It not drinking water since yesterday. And more tired.", 
     "My puppy's name is Charlie. It has not been drinking water since yesterday. He is also more tired."),
    ("My dog name is Milo. He have high fever. And shivering.", 
     "My dog's name is Milo. He has a high fever. He is also shivering."),
    ("My cat name is Luna. She vomit 3 times. And not eating food.", 
     "My cat's name is Luna. She has vomited 3 times. She is also not eating food."),
    ("His name is Rocky. He not walking properly on left leg. And crying in pain.", 
     "His name is Rocky. He is not walking properly on his left leg. He is also crying in pain."),
    ("Her name is Daisy. She losing weight rapid. And more dull.", 
     "Her name is Daisy. She has been losing weight rapidly. She is also more dull."),
    ("Patient name is Duke. Dog not eating from 2 days. And more tired.", 
     "The patient's name is Duke. The dog has not been eating for 2 days. The dog is also more tired."),
    ("My dog name is Buddy. He not pooping from 2 days. And abdomen swollen.", 
     "My dog's name is Buddy. He has not been defecating for 2 days. His abdomen is swollen."),
    ("My puppy name is Coco. She crying when touched on belly. And vomit yellow fluid.", 
     "My puppy's name is Coco. She cries when touched on the abdomen. She has also vomited yellow fluid.")
]

csv_path = os.path.join(os.path.dirname(__file__), "training_data.csv")
existing_inputs = set()

if os.path.exists(csv_path):
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for r in reader:
            if r:
                existing_inputs.add(r[0].strip().lower())

added = 0
with open(csv_path, "a", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    for inp, tgt in generalized_pairs:
        if inp.strip().lower() not in existing_inputs:
            writer.writerow([inp.strip(), tgt.strip()])
            existing_inputs.add(inp.strip().lower())
            added += 1

print(f"Successfully added {added} generalized training pairs to {csv_path}!")

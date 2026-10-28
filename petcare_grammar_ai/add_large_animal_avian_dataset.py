import csv
import os

large_animal_avian_pairs = [
    # =========================================================================
    # 1. EQUINE (Horses, Foals, Mares, Ponies) - Typos & Common Mistake Phrasing
    # =========================================================================
    ("My hosre got colik.", "My horse has colic."),
    ("My hosre got colic.", "My horse has colic."),
    ("Hosre got colic.", "The horse has colic."),
    ("Horse got colic.", "The horse has colic."),
    ("My horse got colik from yesterday.", "My horse has had colic since yesterday."),
    ("My hosre got laminitus.", "My horse has laminitis."),
    ("My horse got laminitus.", "My horse has laminitis."),
    ("My horse got laminitis.", "My horse has laminitis."),
    ("Hosre got founder in front hooves.", "The horse has founder in its front hooves."),
    ("My foal got diaria.", "My foal has diarrhea."),
    ("My foal got diaria from yesterday.", "My foal has had diarrhea since yesterday."),
    ("Foal got diaria for 2 days.", "The foal has had diarrhea for 2 days."),
    ("My hosre got choke.", "My horse has esophageal choke."),
    ("Horse got choke while eating.", "The horse choked while eating."),
    ("My hosre got hoof absess.", "My horse has a hoof abscess."),
    ("Horse got hoof absess.", "The horse has a hoof abscess."),
    ("My horse got thrush in hoof.", "My horse has thrush in its hoof."),
    ("Hosre rolling on ground and kicking belly.", "The horse is rolling on the ground and kicking its abdomen."),
    ("Horse rolling on ground in pain.", "The horse is rolling on the ground in pain."),
    ("My hosre not eating hay.", "My horse is not eating hay."),
    ("Horse not eating hay from morning.", "The horse has not been eating hay since morning."),
    ("Hosre not bearing weight on leg.", "The horse is not bearing weight on its leg."),
    ("My hosre got swollen hock.", "My horse has a swollen hock."),
    ("Horse got laceration on pastern.", "The horse has a laceration on its pastern."),
    ("My foal not nursing from mother.", "My foal is not nursing from its mother."),
    ("Foal not drinking milk from morning.", "The foal has not been nursing since morning."),
    ("My hosre got strangles.", "My horse has strangles."),
    ("Horse got sweat all over body and trembling.", "The horse is sweating profusely and trembling."),
    ("My hosre breathe heavy with heave line.", "My horse is breathing heavily with a heave line."),
    ("Horse got locking stifle.", "The horse has an upward fixation of the patella."),

    # =========================================================================
    # 2. AVIAN (Birds, Parrots, Cockatiels, Budgies) - Typos & Common Mistakes
    # =========================================================================
    ("My brid got egg bind.", "My bird is egg-bound."),
    ("My brid got egg binding.", "My bird is suffering from egg binding."),
    ("Brid got egg binding.", "The bird is suffering from egg binding."),
    ("Bird got egg binding.", "The bird is suffering from egg binding."),
    ("Brid sitting at bottom of cage.", "The bird is sitting at the bottom of its cage."),
    ("Bird sitting at bottom of cage and straining.", "The bird is sitting at the bottom of its cage and straining."),
    ("My brid got swollen vent.", "My bird has a swollen vent."),
    ("My parot got sour crop.", "My parrot has sour crop."),
    ("Parot got sour crop.", "The parrot has sour crop."),
    ("My parot got crop stasis.", "My parrot has crop stasis."),
    ("Brid got crop stasis and vomit seed.", "The bird has crop stasis and is regurgitating seeds."),
    ("My cocktiel feather plucking.", "My cocktiel is plucking its feathers."),
    ("Cocktiel feather plucking on chest.", "The cockatiel is plucking feathers on its chest."),
    ("Brid got scaly face and crusty beak.", "The bird has scaly face mites and a crusty beak."),
    ("My brid got broken blood feather.", "My bird has a bleeding blood feather."),
    ("Bird tail pumping while breathing.", "The bird has tail bobbing while breathing."),
    ("My parot breathing with open beak.", "My parrot is breathing with an open beak."),
    ("Brid fluffed up on perch not moving.", "The bird is fluffed up on its perch and is not moving."),
    ("My brid got watery droppings.", "My bird has watery droppings."),
    ("Brid got diaria from 2 days.", "The bird has had diarrhea for 2 days."),
    ("My budgi got swollen crop with fluid.", "My budgie has a distended crop with fluid."),
    ("My brid got wing drop.", "My bird has a dropped wing."),
    ("Brid not singing and eyes closed.", "The bird is not vocalizing and has its eyes closed."),
    ("My parot got sneezng and nasal discharge.", "My parrot is sneezing and has nasal discharge."),
    ("Bird got feather loss around neck.", "The bird has feather loss around its neck."),

    # =========================================================================
    # 3. BOVINE (Cows, Calves, Cattle, Heifers) - Typos & Common Mistakes
    # =========================================================================
    ("My cow got mastitis.", "My cow has mastitis."),
    ("Cow got mastitis.", "The cow has mastitis."),
    ("Cow got mastitis in udder.", "The cow has mastitis in its udder."),
    ("My cow got swollen udder with blood milk.", "My cow has a swollen udder with blood-tinged milk."),
    ("Cow got bloat in rumen.", "The cow has rumen bloat."),
    ("My cow got bloat.", "My cow has bloat."),
    ("My cow got left side swollen.", "My cow has left-sided ruminal distension."),
    ("Cow is downer and cannot stand.", "The cow is recumbent and cannot stand."),
    ("My cow is downer after calving.", "My cow is recumbent after calving."),
    ("My cow got milk fever.", "My cow has milk fever."),
    ("Cow got milk fever after calving.", "The cow has milk fever after calving."),
    ("My cow got ketosis and not eating grain.", "My cow has ketosis and is not eating concentrate."),
    ("My claf got scours.", "My calf has scours."),
    ("My claf got white scours.", "My calf has white scours."),
    ("Claf got diaria from 2 days.", "The calf has had diarrhea for 2 days."),
    ("Calf got diaria from yesterday.", "The calf has had diarrhea since yesterday."),
    ("My claf not drinking milk.", "My calf is not nursing milk."),
    ("Claf not nursing from morning.", "The calf has not been nursing since morning."),
    ("Cow got foot rot and limping bad.", "The cow has foot rot and is limping badly."),
    ("My cow got foot rot.", "My cow has foot rot."),
    ("My cow got prolapse after birth.", "My cow has a uterine prolapse after parturition."),
    ("Cow got hardware disease.", "The cow has hardware disease."),
    ("My claf got umbilical swelling and fever.", "My calf has an umbilical infection and a fever."),
    ("Cow not chewing cud.", "The cow is not chewing its cud."),
    ("Cow not chewing cud from yesterday.", "The cow has not been chewing its cud since yesterday."),
    ("Cow rumen not moving.", "The cow has rumen stasis."),
    ("Cow rumen not moving from morning.", "The cow has had rumen stasis since morning."),
    ("My cow got frothy bloat.", "My cow has frothy bloat."),
    ("Calf breathe rapid with pneumonia.", "The calf is breathing rapidly with suspected pneumonia."),
    ("Cow got retained placenta after birth.", "The cow has a retained placenta after parturition."),
    ("My cattel got tick fever.", "My cattle have tick-borne fever."),
    ("Cattel got bloody stool.", "The cattle have bloody diarrhea.")
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
    for inp, tgt in large_animal_avian_pairs:
        if inp.strip().lower() not in existing:
            writer.writerow([inp.strip(), tgt.strip()])
            existing.add(inp.strip().lower())
            added += 1

print(f"Added {added} Equine, Avian, and Bovine mistake pairs to {csv_path}!")

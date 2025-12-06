# extraction_service.py
import os
from pathlib import Path
import json
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from nltk.tokenize import RegexpTokenizer

# -------------------------------
# Initialisation du tokenizer
# -------------------------------
# Utilise une expression régulière simple pour tokeniser les mots.
# Avantage : ne dépend pas de punkt/punkt_tab (pas besoin de télécharger des packages NLTK supplémentaires)
tokenizer = RegexpTokenizer(r'\b\w+\b')


# -------------------------------
# Extraction depuis un fichier texte
# -------------------------------
def extract_from_text(file_path):
    """
    Lit un fichier texte, tokenize et calcule les statistiques complètes
    
    Arguments :
    - file_path : chemin vers le fichier texte
    
    Retour :
    - tuple (nom fichier sans extension, dictionnaire avec les statistiques)
    """
    try:
        # Lecture du texte original et nettoyé
        with open(file_path, "r", encoding="utf-8") as f:
            clean_text = f.read()

        # On retrouve le chemin du texte original
        original_file = Path("data/processed/raw_texts") / file_path.name
        if original_file.exists():
            with open(original_file, "r", encoding="utf-8") as f:
                original_text = f.read()
        else:
            original_text = clean_text  # Fallback si on ne trouve pas l'original

        # Stats sur le texte original
        tokens_before = [t.lower() for t in tokenizer.tokenize(original_text)]
        total_tokens_before = len(tokens_before)
        char_count_before = len(original_text)

        # Stats sur le texte nettoyé
        tokens_after = [t.lower() for t in tokenizer.tokenize(clean_text)]
        total_tokens_after = len(tokens_after)
        char_count_after = len(clean_text)

        # Fréquence des mots (tous les mots)
        word_freq = Counter(tokens_after)
        all_words = [(word, count) for word, count in word_freq.items()]

        # Bigrammes complets
        bigrams = list(zip(tokens_after, tokens_after[1:]))
        bigram_freq = Counter([" ".join(bg) for bg in bigrams])
        all_bigrams = [(bigram, count) for bigram, count in bigram_freq.items()]

        # Nom du fichier avec extension
        original_name = file_path.name

        return original_name, {
            "context": clean_text,  # Texte nettoyé
            "total_tokens_before": total_tokens_before,
            "total_tokens_after": total_tokens_after,
            "char_count_before": char_count_before,
            "char_count_after": char_count_after,
            "words": all_words,  # Tous les mots avec leur fréquence
            "bigrams": all_bigrams  # Tous les bigrammes avec leur fréquence
        }

    except Exception as e:
        # En cas d'erreur, on retourne un dictionnaire vide pour ce fichier
        print(f"❌ Erreur extraction {file_path.name}: {e}")
        return file_path.name, {}


# -------------------------------
# Extraction globale du corpus + fusion JSON
# -------------------------------
def extract_corpus(
    input_dir="data/processed/clean_texts",
    output_file="data/processed/metadata.json",
    max_workers=4
):
    """
    Parcourt un dossier de textes normalisés, calcule les statistiques par fichier,
    et fusionne les résultats dans un fichier JSON.
    
    Arguments :
    - input_dir : dossier contenant les fichiers .txt normalisés
    - output_file : fichier JSON pour stocker les métadonnées et statistiques
    - max_workers : nombre de threads pour l'extraction parallèle
    """
    input_path = Path(input_dir)
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Lecture du JSON existant (si présent) pour fusionner avec les nouvelles données
    if output_path.exists():
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
            print(f"🔄 Fichier JSON existant chargé ({len(existing_data)} fichiers).")
        except Exception:
            print("⚠️ Erreur lecture JSON existant — réinitialisation.")
            existing_data = {}
    else:
        existing_data = {}

    # Liste des fichiers texte à traiter
    files = [f for f in input_path.glob("*.txt")]
    results = {}

    # Traitement parallèle avec ThreadPoolExecutor pour accélérer l'extraction
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        for name, data in executor.map(lambda f: extract_from_text(f), files):
            results[name] = data

    # Fusion : mise à jour ou ajout des résultats dans le JSON existant
    for name, data in results.items():
        if name in existing_data:
            existing_data[name].update(data)
        else:
            existing_data[name] = data

    # Sauvegarde des résultats fusionnés
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=4)

    print(f"\n✅ Résultats fusionnés sauvegardés dans {output_file}\n")

    # Affichage console pour suivi rapide
    for name, data in results.items():
        print(f"📄 {name} : {data.get('total_tokens', 0)} tokens")
        print("Top mots :", data.get("top_words", []))
        print("Top bigrammes :", data.get("top_bigrams", []))
        print("-" * 60)

    return existing_data


# -------------------------------
# Exécution directe
# -------------------------------
if __name__ == "__main__":
    # Appel principal pour extraire le corpus et générer JSON
    extract_corpus()

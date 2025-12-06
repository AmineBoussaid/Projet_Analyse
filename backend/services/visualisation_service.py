#backend\services\visualisation_service.py
import json
import os
from pathlib import Path
from datetime import datetime
from collections import Counter, defaultdict


def compute_visualisation_data(metadata_path="data/processed/metadata.json"):
    path = Path(metadata_path)
    if not path.exists():
        return {}

    with open(path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    # Exemple simple : agrégation des mots dans tous les fichiers
    word_counts = {}
    for fname, data in metadata.items():
        for word, count in data.get("words", []):
            word_counts[word] = word_counts.get(word, 0) + count

    # Top mots
    top_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:50]

    # Exemple simple de statistique : nombre de fichiers, nombre de mots totaux
    num_files = len(metadata)
    total_words = sum(word_counts.values())

    # Calculer la taille totale et date du dernier import
    total_size_bytes = 0
    latest_date = None
    type_counts = Counter()
    corpus_dir = Path("data/corpus")
    
    for fname, data in metadata.items():
        # Taille - chercher dans le corpus si non présent dans metadata
        size = data.get("size", data.get("size_bytes", 0))
        if size == 0 and corpus_dir.exists():
            # Chercher le fichier dans le corpus
            found = list(corpus_dir.rglob(fname))
            if found:
                size = found[0].stat().st_size
        total_size_bytes += size
        
        # Date d'import
        date_str = data.get("date_import")
        if date_str:
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                if latest_date is None or date_obj > latest_date:
                    latest_date = date_obj
            except:
                pass
        
        # Type de document
        doc_type = data.get("type", "inconnu")
        type_counts[doc_type] += 1
    
    # Convertir la taille en Mo
    total_size_mo = round(total_size_bytes / (1024 * 1024), 2)
    
    # Formater la date du dernier import
    last_import_date = latest_date.strftime("%Y-%m-%d") if latest_date else "Aucun"
    
    # Top 5 types les plus importés
    top_types = type_counts.most_common(5)

    # Exemple relation documents (ici vide pour simplifier)
    relations = []

    return {
        "top_words": top_words,
        "num_files": num_files,
        "total_words": total_words,
        "total_size_mo": total_size_mo,
        "last_import_date": last_import_date,
        "top_types": top_types,
        "relations": relations
    }


def stats_imports_by_date(imports):
    """
    Retourne le nombre de documents importés et taille totale par date.
    imports = [
        {"name": "doc1.pdf", "type": "pdf", "size": 1024, "date": "2025-10-01"},
        ...
    ]
    """
    data = defaultdict(lambda: {"count": 0, "size": 0, "types": Counter()})
    for imp in imports:
        date = imp["date"]
        data[date]["count"] += 1
        data[date]["size"] += imp["size"]
        data[date]["types"][imp["type"]] += 1

    # Transformer en liste triée
    result = []
    for date, info in sorted(data.items()):
        result.append({
            "date": date,
            "count": info["count"],
            "size": info["size"],
            "types": dict(info["types"])
        })
    return result



def get_all_imports(base_dir="data/corpus"):
    """
    Simule la récupération des métadonnées d'import depuis le dossier corpus.
    Retourne une liste de dictionnaires :
    [
      {"name": "fichier.txt", "type": "txt", "size": 12345, "date": "2025-11-03"},
      ...
    ]
    """
    imports = []
    base = Path(base_dir)
    if not base.exists():
        return imports

    for file in base.rglob("*"):
        if file.is_file():
            # type du fichier (extension)
            ext = file.suffix.lower().replace(".", "") or "inconnu"
            # taille
            size = file.stat().st_size
            # date de modification -> utilisée comme date d'import
            date = datetime.fromtimestamp(file.stat().st_mtime).strftime("%Y-%m-%d")
            imports.append({
                "name": file.name,
                "type": ext,
                "size": size,
                "date": date
            })
    return imports

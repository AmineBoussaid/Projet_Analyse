# Analyse et Traitement Automatisé de Fichiers Textuels

This is a minimal scaffold for the project described. It provides:

- A small Flask app (`app.py`) with admin and client pages.
- A `processors.py` module that extracts text from `.txt`, `.docx`, `.pdf` (when libs installed), cleans and (optionally) lemmatizes using spaCy.
- A temporary JSON index at `data/texts.json` used for early testing (we'll migrate to a DB later).

Installation (Windows PowerShell):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# si vous voulez le modèle français spaCy:
python -m spacy download fr_core_news_sm
python app.py
```

Usage:

- Ouvrir `http://127.0.0.1:5000/admin` pour uploader des fichiers et lancer l'analyse.
- Page client: `http://127.0.0.1:5000/client` pour faire des recherches simples dans le JSON d'index.

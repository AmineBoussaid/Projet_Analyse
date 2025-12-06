from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import os, json, shutil
from bs4 import BeautifulSoup
import docx2txt
import fitz  # PyMuPDF
import pdfplumber
from zipfile import ZipFile
import rarfile
from PIL import Image
import io
import pytesseract
import base64

# ---------------------------
# Lecture des fichiers simples
# ---------------------------

def read_txt(file_path):
    """Lit un fichier texte et retourne son contenu."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = "\n".join(line.strip() for line in f)
        return text, 1  # num_pages = 1 pour txt
    except:
        return "", 0

def read_html(file_path):
    """Lit un fichier HTML/HTM et retourne le texte nettoyé."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = BeautifulSoup(f, 'html.parser').get_text(separator=' ', strip=True)
        return text, 1
    except:
        return "", 0

def read_docx_full(file_path):
    """Lit un fichier DOCX et effectue une OCR sur les images intégrées."""
    text = docx2txt.process(file_path)
    try:
        with ZipFile(file_path) as docx_zip:
            for item in docx_zip.namelist():
                # OCR sur les images contenues dans le DOCX
                if item.startswith("word/media/") and item.lower().endswith((".png", ".jpg", ".jpeg")):
                    image_data = docx_zip.read(item)
                    ocr_text = pytesseract.image_to_string(
                        Image.open(io.BytesIO(image_data)).convert("L")
                    )
                    if ocr_text.strip():
                        text += "\n" + ocr_text
    except:
        pass
    return text, 1

def read_pdf_full(file_path):
    """Lit un fichier PDF et retourne tout le texte (via PyMuPDF et pdfplumber)."""
    text = ""
    try:
        # Extraction avec PyMuPDF
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text() + "\n"
        # Extraction supplémentaire avec pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except:
        pass
    return text, 1

# ---------------------------
# Extraction d'archives ZIP / RAR
# ---------------------------

def extract_archive(archive_path, extract_to):
    """Extrait un fichier ZIP ou RAR dans un dossier donné et retourne la liste des fichiers extraits."""
    try:
        extract_to.mkdir(parents=True, exist_ok=True)
        if archive_path.suffix.lower() == ".zip":
            with ZipFile(archive_path, "r") as zip_ref:
                zip_ref.extractall(extract_to)
        elif archive_path.suffix.lower() == ".rar":
            with rarfile.RarFile(archive_path, "r") as rar_ref:
                rar_ref.extractall(extract_to)
        else:
            return []  # Type d'archive non supporté

        # Retourne tous les fichiers extraits
        return [p for p in extract_to.rglob("*") if p.is_file()]
    except:
        return []

# ---------------------------
# Copier un fichier vers le corpus
# ---------------------------

def copy_to_corpus(file_path, corpus_dir):
    """
    Copie un fichier dans le dossier corpus_dir/TYPE en préservant le nom exact du fichier.
    Organise les fichiers par type (pdf/, docx/, txt/, html/, htm/).
    Retourne le chemin vers le fichier copié.
    """
    file_path = Path(file_path)
    corpus_dir = Path(corpus_dir)
    
    # Déterminer le type de fichier et créer le dossier correspondant
    ext = file_path.suffix.lower().lstrip('.')
    if ext not in ['pdf', 'docx', 'doc', 'txt', 'html', 'htm']:
        ext = 'other'
    
    type_dir = corpus_dir / ext
    type_dir.mkdir(parents=True, exist_ok=True)
    
    # Utilise le nom exact du fichier sans modification
    dest = type_dir / file_path.name
    
    # Évite de recopier si déjà présent
    if file_path.resolve() == dest.resolve():
        return dest

    # Copie le fichier en préservant le nom exact
    shutil.copy2(file_path, dest)  # shutil.copy2 préserve les métadonnées aussi
    return dest

# ---------------------------
# Traitement d'un fichier individuel
# ---------------------------

def process_file(file_path, corpus_dir, output_dir):
    """
    Lit un fichier, extrait le texte, traite les images pour OCR si nécessaire,
    et sauvegarde le texte nettoyé dans output_dir.
    Retourne le nom du fichier et les métadonnées.
    """
    # Copier dans le corpus
    corpus_file = copy_to_corpus(file_path, corpus_dir)

    ext = corpus_file.suffix.lower()
    text, num_pages = "", 0
    thumbnail_data = None

    # Lecture selon le type de fichier
    if ext == ".txt":
        try:
            with open(corpus_file, 'r', encoding='utf-8', errors='ignore') as f:
                text = "\n".join(line.strip() for line in f)
                num_pages = 1
        except:
            pass
    elif ext in [".html", ".htm"]:
        try:
            with open(corpus_file, 'r', encoding='utf-8', errors='ignore') as f:
                text = BeautifulSoup(f, 'html.parser').get_text(separator=' ', strip=True)
                num_pages = 1
        except:
            pass
    elif ext == ".docx":
        try:
            text = docx2txt.process(corpus_file)
            num_pages = 1
            # OCR sur les images dans le DOCX
            with ZipFile(corpus_file) as docx_zip:
                for item in docx_zip.namelist():
                    if item.startswith("word/media/") and item.lower().endswith((".png", ".jpg", ".jpeg")):
                        image_data = docx_zip.read(item)
                        ocr_text = pytesseract.image_to_string(
                            Image.open(io.BytesIO(image_data)).convert("L")
                        )
                        if ocr_text.strip():
                            text += "\n" + ocr_text
        except:
            pass
    elif ext == ".pdf":
        try:
            doc = fitz.open(corpus_file)
            for page in doc:
                text += page.get_text() + "\n"
            num_pages = doc.page_count
            # Générer vignette (PNG base64) de la première page si possible
            try:
                page0 = doc.load_page(0)
                pix = page0.get_pixmap(matrix=fitz.Matrix(1.0, 1.0))
                img_bytes = pix.tobytes("png")
                thumbnail_data = f"data:image/png;base64,{base64.b64encode(img_bytes).decode('utf-8')}"
            except Exception:
                thumbnail_data = None
            # Extraction supplémentaire avec pdfplumber
            with pdfplumber.open(corpus_file) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
        except:
            pass

    text = text.strip()
    char_count_before = len(text)

    # Sauvegarde du texte nettoyé avec le nom complet du fichier + .txt
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"{corpus_file.name}.txt"
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(text)
    except:
        pass

    # Retourne le nom du fichier complet avec extension et les métadonnées
    return corpus_file.name, {
        "type": ext.replace(".", ""),
        "num_pages": num_pages,
        "char_count_before": char_count_before,
        "path": str(corpus_file),
        "thumbnail": thumbnail_data,
        "size_bytes": corpus_file.stat().st_size
    }

# ---------------------------
# Lecture complète du corpus
# ---------------------------

def read_corpus(base_path="data/import", corpus_dir="data/corpus", output_path="data/processed/raw_texts", max_workers=4):
    """
    Parcourt récursivement le dossier base_path pour trouver les fichiers supportés.
    Extrait les archives, traite tous les fichiers et sauvegarde les métadonnées.
    Retourne un dictionnaire avec les résultats.
    """
    base_path = Path(base_path)
    corpus_dir = Path(corpus_dir)
    output_dir = Path(output_path)
    output_dir.mkdir(parents=True, exist_ok=True)

    supported_ext = [".txt", ".pdf", ".docx", ".html", ".htm"]
    archive_ext = [".zip", ".rar"]

    all_files = []
    # Parcours des fichiers dans base_path
    for root, _, files in os.walk(base_path):
        for file in files:
            fpath = Path(root) / file
            if fpath.suffix.lower() in supported_ext:
                all_files.append(fpath)
            elif fpath.suffix.lower() in archive_ext:
                # Extraction des archives
                extracted = extract_archive(fpath, base_path / f"extracted_{fpath.stem}")
                all_files.extend([p for p in extracted if p.suffix.lower() in supported_ext])

    results = {}
    # Traitement parallèle des fichiers
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        for name, data in executor.map(lambda f: process_file(f, corpus_dir, output_dir), all_files):
            results[name] = data

    # Sauvegarde des métadonnées en JSON
    with open("data/processed/metadata.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=4)

    print(f"✅ Corpus traité avec {len(results)} fichiers")
    return results


if __name__ == "__main__":
    read_corpus()

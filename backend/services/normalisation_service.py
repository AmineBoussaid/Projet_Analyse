# normalisation_service.py
import os
from pathlib import Path
import re
import stopwordsiso
from langdetect import detect, DetectorFactory
from concurrent.futures import ThreadPoolExecutor
import fitz
from PIL import Image
import io
import pytesseract
import pdfplumber
import json

# Initialisation
DetectorFactory.seed = 0

# Attempt to load spacy models (may fail in Python 3.14)
SPACY_LOADED = False
nlp_fr = None
nlp_en = None
try:
    import spacy
    try:
        nlp_fr = spacy.load("fr_core_news_sm", disable=["ner"])
        nlp_en = spacy.load("en_core_web_sm", disable=["ner"])
        SPACY_LOADED = True
    except OSError:
        print("Warning: spaCy models not installed. Using fallback text processing.")
except ImportError:
    print("Warning: spaCy not available. Using fallback text processing.")

# Stopwords multilingues via stopwordsiso
STOPWORDS = set()
for lang in ["fr", "en", "es", "de", "it"]:
    try:
        STOPWORDS |= stopwordsiso.stopwords(lang)
    except Exception:
        pass

if SPACY_LOADED:
    try:
        STOPWORDS |= nlp_fr.Defaults.stop_words
        STOPWORDS |= nlp_en.Defaults.stop_words
    except Exception:
        pass

def detect_language(text: str) -> str:
    """Detects the language of the text."""
    try:
        return detect(text)
    except Exception:
        return "unknown"

def get_spacy_model(lang_code: str):
    """Returns the spaCy model for the detected language."""
    if not SPACY_LOADED:
        return None
    if lang_code == "fr":
        return nlp_fr
    elif lang_code == "en":
        return nlp_en
    return nlp_fr

def clean_text(text: str, lemmatize: bool = True) -> str:
    """
    Cleans and normalizes text:
    - lowercase conversion
    - removal of non-alphabetic characters
    - tokenization and lemmatization (if spacy available)
    - stopword removal
    - preservation of technical acronyms
    """
    if not text or len(text.strip()) == 0:
        return ""

    lang = detect_language(text)
    nlp = get_spacy_model(lang)

    # Step 1: Lowercase
    text = text.lower()

    # Step 2: Clean non-alphabetic characters
    text = re.sub(r"[^a-zà-ÿ\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    # Fallback to simple regex cleaning if spacy unavailable
    if nlp is None:
        tokens = text.split()
        tokens = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
        return " ".join(tokens)

    # Step 3: Tokenization and lemmatization with spaCy
    doc = nlp(text)
    tokens = []
    for token in doc:
        lemma = token.lemma_ if lemmatize else token.text
        lemma = lemma.strip()

        # Exclusion conditions
        if not lemma.isalpha():
            continue
        if lemma in STOPWORDS:
            continue
        if len(lemma) <= 2:
            if token.text.isupper() or token.text.lower() in {"ai", "ml", "ux", "ui"}:
                tokens.append(token.text.lower())
            continue

        tokens.append(lemma)

    return " ".join(tokens)

def read_pdf_with_ocr(pdf_path: Path) -> str:
    """
    Reads a PDF and extracts:
    - standard text (via PyMuPDF and pdfplumber)
    - text from images via OCR (pytesseract)
    """
    text = ""
    try:
        # Standard text with PyMuPDF
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text() + "\n"

        # Additional text with pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                # Extract normal text
                text += page.extract_text() or ""

                # Extract OCR from images on the page
                try:
                    for image in page.images:
                        x0, y0, x1, y1 = image["bbox"]
                        im = page.to_image()
                        cropped = im.crop((x0, y0, x1, y1))
                        ocr_text = pytesseract.image_to_string(cropped)
                        if ocr_text.strip():
                            text += "\n" + ocr_text
                except Exception:
                    pass

    except Exception as e:
        print(f"Error reading PDF {pdf_path.name}: {e}")

    return text

def process_file(file_path: Path, output_dir: Path, lemmatize=True):
    """
    Reads a TXT or PDF file, cleans and normalizes the text.
    Saves the cleaned text to output_dir.
    Returns the filename and cleaned text.
    """
    try:
        ext = file_path.suffix.lower()
        if ext == ".pdf":
            raw_text = read_pdf_with_ocr(file_path)
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                raw_text = f.read()

        clean = clean_text(raw_text, lemmatize=lemmatize)
        lang = detect_language(raw_text)
        output_file = output_dir / file_path.name

        # Save normalized text
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(clean)

        print(f"Processed {file_path.name} ({lang.upper()}): {len(clean.split())} tokens")
        return file_path.name, clean

    except Exception as e:
        print(f"Error processing {file_path.name}: {e}")
        return file_path.name, ""

def normalize_corpus(input_dir="data/processed/raw_texts",
                     output_dir="data/processed/clean_texts",
                     meta_file="data/processed/metadata.json",
                     max_workers=4,
                     lemmatize=True):
    """
    Processes all text and PDF files in input_dir,
    cleans and normalizes them, saves to output_dir.
    Updates metadata with character counts after normalization.
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    files = list(input_path.glob("*"))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        for file_path in files:
            process_file(file_path, output_path, lemmatize=lemmatize)

    print(f"\nNormalization complete. Cleaned files are in {output_dir}")
    return None

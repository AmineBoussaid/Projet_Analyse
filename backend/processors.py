import os, json, re
try:
    import spacy
    nlp = spacy.load('fr_core_news_sm')
except Exception:
    nlp = None
try:
    from wordcloud import WordCloud
except Exception:
    WordCloud = None


def extract_text(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == '.txt':
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception:
            return ''
    elif ext == '.docx':
        try:
            from docx import Document
            doc = Document(path)
            return '\n'.join(p.text for p in doc.paragraphs)
        except Exception:
            return ''
    elif ext == '.pdf':
        try:
            from pdfminer.high_level import extract_text as pdf_extract
            return pdf_extract(path)
        except Exception:
            return ''
    elif ext == '.html' or ext == '.htm':
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                raw = f.read()
            # naive strip tags
            text = re.sub(r'<[^>]+>', ' ', raw)
            return text
        except Exception:
            return ''
    else:
        return ''


def count_pdf_pages(path):
    try:
        from pdfminer.pdfpage import PDFPage
        with open(path, 'rb') as fh:
            return sum(1 for _ in PDFPage.get_pages(fh))
    except Exception:
        return None


def clean_and_lemmatize(text):
    text = (text or '').lower()
    text = re.sub(r'[^a-zàâäéèêëïîôöùûüÿç0-9\s\-]', ' ', text)
    words = [t for t in re.split(r'\s+', text) if t]
    removed = 0
    lemmas = {}
    cleaned_text = ''  # Will store the cleaned text
    if nlp:
        doc = nlp(' '.join(words))
        cleaned_tokens = []
        for tok in doc:
            if tok.pos_ in ('PRON', 'DET', 'ADP', 'CCONJ', 'SCONJ'):
                removed += 1
                continue
            if tok.is_punct or tok.is_space or tok.is_stop:
                removed += 1
                continue
            if len(tok.text.strip()) <= 2:
                removed += 1
                continue
            lemma = tok.lemma_.lower()
            if len(lemma) <= 2:
                removed += 1
                continue
            lemmas[lemma] = lemmas.get(lemma, 0) + 1
            cleaned_tokens.append(tok.text.strip())
        total_tokens = len([t for t in doc if not (t.is_space)])
        cleaned_text = ' '.join(cleaned_tokens)
    else:
        cleaned_tokens = []
        for t in words:
            if len(t) <= 2:
                removed += 1
                continue
            lemmas[t] = lemmas.get(t, 0) + 1
            cleaned_tokens.append(t)
        total_tokens = len(words)
        cleaned_text = ' '.join(cleaned_tokens)
    return lemmas, removed, total_tokens, cleaned_text


def process_and_index(paths, output_json):
    indexed = []
    total_size = 0
    total_words = 0
    total_removed = 0
    aggregate = {}
    for p in paths:
        txt = extract_text(p)
        size = os.path.getsize(p) if os.path.exists(p) else 0
        lemmas, removed, words, cleaned_text = clean_and_lemmatize(txt)
        # character count
        char_count = len(cleaned_text or '')
        # pages: try PDF page count, otherwise estimate by chars
        pages = None
        ext = os.path.splitext(p)[1].lower()
        if ext == '.pdf':
            pages = count_pdf_pages(p)
        if pages is None:
            # rough estimate: 1800 chars per page
            pages = max(1, int((char_count or 0) / 1800) or 1)
        total_size += size
        total_words += words
        total_removed += removed
        for k, v in lemmas.items():
            aggregate[k] = aggregate.get(k, 0) + v
        indexed.append({
            'filename': os.path.basename(p),
            'path': p,
            'size': size,
            'word_count': words,
            'removed': removed,
            'lemmas': lemmas,
            'text_sample': (cleaned_text or '')[:500],
            'cleaned_text': cleaned_text or '',
            'imported_at': __import__('datetime').datetime.utcnow().isoformat(),
            'characters': char_count,
            'pages': pages,
            'type': ext.lstrip('.')
        })
    summary = {
        'files': len(indexed),
        'total_size': total_size,
        'total_words': total_words,
        'total_removed': total_removed
    }
    top = sorted(aggregate.items(), key=lambda x: x[1], reverse=True)[:20]
    wc_path = None
    try:
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(indexed, f, ensure_ascii=False, indent=2)
    except Exception:
        pass
    if WordCloud and aggregate:
        try:
            os.makedirs('static/wordclouds', exist_ok=True)
            wc = WordCloud(width=800, height=400, background_color='white', collocations=False)
            wc.generate_from_frequencies(aggregate)
            wc_path = os.path.join('static', 'wordclouds', 'wordcloud.png')
            wc.to_file(wc_path)
        except Exception:
            wc_path = None
    return {'indexed': indexed, 'summary': summary, 'top': top, 'wordcloud': wc_path}

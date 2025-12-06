import warnings

# Silence pkg_resources deprecation warning emitted by stopwordsiso before any imports trigger it
warnings.filterwarnings(
    "ignore",
    message="pkg_resources is deprecated as an API",
    category=UserWarning,
    module="stopwordsiso._core",
)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from controllers.document_controller import document_bp
from pathlib import Path
import os
import json
from datetime import datetime

# Config
SECRET_KEY = 'dev-secret-key-change-in-prod'

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.secret_key = SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max

# Create required data directories
os.makedirs('data/corpus', exist_ok=True)
os.makedirs('data/processed', exist_ok=True)

# Register blueprints
app.register_blueprint(document_bp, url_prefix="/api")

# =====================================
# Authentication Routes
# =====================================

@app.route('/api/login', methods=['POST'])
def login():
    """Fake login: just accept role selection."""
    data = request.get_json() or {}
    role = data.get('role', '').lower()
    if role not in ('admin', 'user'):
        return jsonify({'error': 'Invalid role'}), 400
    return jsonify({'role': role, 'token': 'fake-jwt-' + role})


@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout (stateless, nothing to do)."""
    return jsonify({'message': 'Logged out'})


# =====================================
# Health Check
# =====================================

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'message': 'Backend is running'})


# =====================================
# Admin Stats Alias (for old frontend routes)
# =====================================

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    """Admin stats endpoint - delegates to visualisation service."""
    from services.visualisation_service import compute_visualisation_data, get_all_imports, stats_imports_by_date
    
    # Get visualisation data
    viz_data = compute_visualisation_data()
    
    # Get imports stats
    imports = get_all_imports()
    imports_stats = stats_imports_by_date(imports)
    
    # Build by_date structure for compatibility
    by_date_dict = {}
    for stat in imports_stats:
        by_date_dict[stat['date']] = stat.get('count', 0)
    
    if by_date_dict:
        sorted_items = sorted(by_date_dict.items())
        by_date = {'labels': [k for k, _ in sorted_items], 'data': [v for _, v in sorted_items]}
    else:
        by_date = {'labels': [], 'data': []}
    
    # Build by_type structure
    by_type = {}
    for word, count in viz_data.get('top_types', []):
        by_type[word] = count
    
    return jsonify({
        'total_docs': viz_data.get('num_files', 0),
        'total_words': viz_data.get('total_words', 0),
        'total_size': round(viz_data.get('total_size_mo', 0) * 1024 * 1024),  # Convert back to bytes
        'last_import': viz_data.get('last_import_date', 'Aucun'),
        'by_type': by_type,
        'by_date': by_date,
        'top_words': viz_data.get('top_words', [])
    })


@app.route('/api/admin/files', methods=['GET'])
def admin_files():
    """Get list of indexed files with optional search - delegates to /api/documents"""
    q = request.args.get('q', '').strip().lower()
    
    metadata_file = Path("data/processed/metadata.json")
    if not metadata_file.exists():
        return jsonify([])
    
    try:
        with open(metadata_file, "r", encoding="utf-8") as f:
            metadata = json.load(f)
    except Exception:
        return jsonify([])
    
    rows = []
    corpus_dir = Path("data/corpus")
    
    for key, data in metadata.items():
        # Apply search filter if provided
        if q and q not in key.lower() and q not in json.dumps(data).lower():
            continue
        
        # Trouver le fichier dans le corpus
        file_path = data.get('path')
        if not file_path or not Path(file_path).exists():
            # Chercher dans le corpus
            found = list(corpus_dir.rglob(key))
            if found:
                file_path = str(found[0].resolve())
            else:
                file_path = None
        
        # Calculer le chemin relatif pour le téléchargement/visualisation
        corpus_relpath = data.get('corpus_relpath')
        if not corpus_relpath and file_path:
            try:
                corpus_relpath = str(Path(file_path).resolve().relative_to(corpus_dir.resolve())).replace('\\', '/')
            except:
                corpus_relpath = key
        elif not corpus_relpath:
            corpus_relpath = key
        
        rows.append({
            'filename': key,
            'name': key,
            'type': data.get('type'),
            'size': data.get('size', 0),
            'num_pages': data.get('num_pages'),
            'word_count': data.get('total_tokens_after'),
            'characters': data.get('char_count_after'),
            'date_import': data.get('date_import', 'Inconnue'),
            'path': file_path,
            'corpus_relpath': corpus_relpath,
            'cleaned_text': (data.get('context', '')[:300]) if data.get('context') else ''
        })
    
    return jsonify(rows)


@app.route('/api/admin/delete', methods=['POST'])
def admin_delete():
    """Delete a document by filename."""
    payload = request.get_json(silent=True) or {}
    filename = payload.get('filename')
    
    print(f"[DELETE] Demande de suppression pour: {filename}")
    
    if not filename:
        return jsonify({'error': 'filename required'}), 400
    
    metadata_file = Path("data/processed/metadata.json")
    corpus_dir = Path("data/corpus")
    
    if metadata_file.exists():
        try:
            with open(metadata_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)
        except Exception:
            metadata = {}
    else:
        metadata = {}
    
    deleted_files = []
    
    try:
        # Delete processed files
        raw_file = Path("data/processed/raw_texts") / f"{filename}.txt"
        clean_file = Path("data/processed/clean_texts") / f"{filename}.txt"
        for p in [raw_file, clean_file]:
            if p.exists():
                p.unlink()
                deleted_files.append(str(p))
                print(f"[DELETE] Supprimé: {p}")
        
        # Delete original file from corpus
        found = None
        for f in corpus_dir.rglob("*"):
            if f.is_file() and f.name == filename:
                found = f
                break
        
        if found:
            found.unlink()
            deleted_files.append(str(found))
            print(f"[DELETE] Supprimé du corpus: {found}")
        else:
            print(f"[DELETE] Fichier non trouvé dans corpus: {filename}")
        
        # Remove from metadata
        if filename in metadata:
            metadata.pop(filename)
            print(f"[DELETE] Retiré des métadonnées: {filename}")
        else:
            print(f"[DELETE] Pas dans les métadonnées: {filename}")
        
        # Save updated metadata
        metadata_file.parent.mkdir(parents=True, exist_ok=True)
        with open(metadata_file, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=4)
        
        print(f"[DELETE] Suppression terminée. Fichiers supprimés: {deleted_files}")
        return jsonify({
            'message': f'Deleted {filename}',
            'deleted_files': deleted_files,
            'success': True
        })
    except Exception as e:
        print(f"[DELETE] Erreur: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/download', methods=['GET'])
def admin_download():
    """Download a file from corpus."""
    path = request.args.get('path')
    if not path:
        return jsonify({'error': 'path required'}), 400
    
    try:
        corpus_dir = Path("data/corpus")
        file_path = Path(path)
        
        # Si le path est absolu et existe, l'utiliser
        if file_path.is_absolute() and file_path.exists():
            return send_from_directory(file_path.parent, file_path.name, as_attachment=True)
        
        # Sinon, chercher dans corpus en utilisant le path comme relatif
        file_in_corpus = corpus_dir / path
        if file_in_corpus.exists():
            return send_from_directory(file_in_corpus.parent, file_in_corpus.name, as_attachment=True)
        
        # Dernier recours: chercher par nom de fichier
        filename = Path(path).name
        found = list(corpus_dir.rglob(filename))
        if found:
            fp = found[0]
            return send_from_directory(fp.parent, fp.name, as_attachment=True)
        
        return jsonify({'error': f'File not found: {path}'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/file_stats', methods=['GET'])
def admin_file_stats():
    """Return per-file detailed statistics."""
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'error': 'filename required'}), 400
    
    metadata_file = Path("data/processed/metadata.json")
    if not metadata_file.exists():
        return jsonify({'error': 'No metadata found'}), 404
    
    try:
        with open(metadata_file, "r", encoding="utf-8") as f:
            metadata = json.load(f)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    data = metadata.get(filename, {})
    if not data:
        return jsonify({'error': f'{filename} not found'}), 404
    
    return jsonify({
        'filename': filename,
        'type': data.get('type'),
        'total_tokens_before': data.get('total_tokens_before'),
        'total_tokens_after': data.get('total_tokens_after'),
        'char_count_before': data.get('char_count_before'),
        'char_count_after': data.get('char_count_after'),
        'words': data.get('words', [])[:50],  # Top 50
        'bigrams': data.get('bigrams', [])[:50],  # Top 50
    })


@app.route('/api/admin/file_detail', methods=['GET'])
def admin_file_detail():
    """Return detailed file information for display."""
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'error': 'filename required'}), 400
    
    metadata_file = Path("data/processed/metadata.json")
    if not metadata_file.exists():
        return jsonify({'error': 'No metadata found'}), 404
    
    try:
        with open(metadata_file, "r", encoding="utf-8") as f:
            metadata = json.load(f)
    except Exception:
        return jsonify({'error': 'Failed to load metadata'}), 500
    
    data = metadata.get(filename, {})
    if not data:
        return jsonify({'error': f'{filename} not found'}), 404
    
    return jsonify({
        'filename': filename,
        'type': data.get('type'),
        'date_import': data.get('date_import', 'Inconnue'),
        'num_pages': data.get('num_pages'),
        'total_tokens_after': data.get('total_tokens_after'),
        'char_count_after': data.get('char_count_after'),
        'context': data.get('context', '')[:1000],  # First 1000 chars
        'words': data.get('words', [])[:30],
        'bigrams': data.get('bigrams', [])[:30],
        'thumbnail': data.get('thumbnail'),
    })


@app.route('/api/admin/view', methods=['GET'])
def admin_view():
    """View/serve the original file (PDF, TXT, etc.) from corpus."""
    filename = request.args.get('filename')
    if not filename:
        return "<h1>Erreur</h1><p>Nom de fichier manquant</p>", 400
    
    corpus_dir = Path("data/corpus")
    
    # Chercher le fichier dans le corpus
    found_file = None
    for f in corpus_dir.rglob("*"):
        if f.is_file() and f.name == filename:
            found_file = f
            break
    
    if not found_file:
        return f"<h1>Erreur</h1><p>Fichier '{filename}' introuvable dans le corpus</p>", 404
    
    # Déterminer le type de fichier
    file_ext = found_file.suffix.lower()
    file_type = file_ext.lstrip('.')
    
    try:
        # Pour les PDF, les servir directement
        if file_type == 'pdf':
            return send_from_directory(
                found_file.parent,
                found_file.name,
                mimetype='application/pdf'
            )
        
        # Pour les fichiers texte, HTML, lire et afficher dans une page
        elif file_type in ['txt', 'html', 'htm']:
            try:
                with open(found_file, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                # Essayer avec latin-1 si UTF-8 échoue
                with open(found_file, 'r', encoding='latin-1') as f:
                    content = f.read()
            
            # Pour HTML/HTM, servir directement
            if file_type in ['html', 'htm']:
                return content, 200, {'Content-Type': 'text/html; charset=utf-8'}
            
            # Pour TXT, créer une page HTML simple
            html_content = f"""
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{filename}</title>
    <style>
        body {{
            font-family: 'Courier New', monospace;
            max-width: 1000px;
            margin: 20px auto;
            padding: 30px;
            background: #f5f5f5;
        }}
        .container {{
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            font-size: 20px;
        }}
        pre {{
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.6;
            color: #333;
            font-size: 14px;
        }}
        .close-btn {{
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 20px;
        }}
        .close-btn:hover {{
            background: #5568d3;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>📄 {filename}</h1>
        <pre>{content}</pre>
        <button class="close-btn" onclick="window.close()">Fermer</button>
    </div>
</body>
</html>
"""
            return html_content, 200, {'Content-Type': 'text/html; charset=utf-8'}
        
        # Pour DOCX et autres formats, télécharger le fichier
        else:
            return send_from_directory(
                found_file.parent,
                found_file.name,
                as_attachment=False
            )
    
    except Exception as e:
        return f"<h1>Erreur</h1><p>Impossible d'ouvrir le fichier: {str(e)}</p>", 500


@app.route('/api/wordcloud', methods=['GET'])
def wordcloud():
    """Return wordcloud data (top words)."""
    from services.visualisation_service import compute_visualisation_data
    
    viz_data = compute_visualisation_data()
    top_words = viz_data.get('top_words', [])
    
    # Format for wordcloud: {"word": count, ...}
    wordcloud_dict = {word: count for word, count in top_words}
    
    return jsonify(wordcloud_dict)


if __name__ == "__main__":
    # Start server on localhost:5000
    app.run(host="0.0.0.0", port=5000, debug=True)

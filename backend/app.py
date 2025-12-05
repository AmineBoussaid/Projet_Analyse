from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os, json
from processors import process_and_index, extract_text
import models
from functools import wraps
from datetime import datetime

# Config
UPLOAD_FOLDER = os.path.join('data', 'uploads')
DATA_JSON = 'data/texts.json'
SECRET_KEY = 'dev-secret-key-change-in-prod'

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('data', exist_ok=True)

# Initialize DB
try:
    models.init_db()
except Exception as e:
    print(f"DB init warning: {e}")


def check_auth(f):
    """Decorator to check role from request header or session."""
    @wraps(f)
    def wrapped(*args, **kwargs):
        role = request.headers.get('X-Role', None)
        if not role:
            return jsonify({'error': 'Unauthorized'}), 401
        if role not in ('admin', 'user'):
            return jsonify({'error': 'Invalid role'}), 401
        return f(*args, **kwargs)
    return wrapped


def check_admin(f):
    """Decorator to check admin role."""
    @wraps(f)
    def wrapped(*args, **kwargs):
        role = request.headers.get('X-Role', None)
        if role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return wrapped


# === Auth Routes ===
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


# === Admin Routes ===
@app.route('/api/documents', methods=['GET'])
def public_documents():
    """Public endpoint returning all document metadata for frontend (no auth)."""
    data = []
    if os.path.exists(DATA_JSON):
        try:
            with open(DATA_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception:
            data = []

    out = []
    for item in data:
        out.append({
            'name': item.get('filename'),
            'filename': item.get('filename'),
            'path': item.get('path'),
            'type': item.get('type'),
            'size': item.get('size'),
            'num_pages': item.get('pages') or item.get('num_pages'),
            'word_count': item.get('word_count'),
            'characters': item.get('characters') or item.get('char_count'),
            'date_import': item.get('imported_at') or item.get('date_import'),
            'corpus_relpath': item.get('path')
        })
    return jsonify(out)


@app.route('/api/admin/stats', methods=['GET'])
@check_admin
def admin_stats():
    """Admin stats endpoint."""
    data = []
    if os.path.exists(DATA_JSON):
        try:
            with open(DATA_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception:
            data = []
    
    total_docs = len(data)
    total_size = sum(d.get('size', 0) for d in data)
    total_words = sum(d.get('word_count', 0) for d in data)
    last_import = None
    for d in data:
        imported = d.get('imported_at')
        if imported:
            try:
                dt = datetime.fromisoformat(imported)
                if last_import is None or dt > last_import:
                    last_import = dt
            except Exception:
                pass
    
    by_type = {}
    for d in data:
        ext = os.path.splitext(d.get('filename', ''))[1].lstrip('.').lower()
        by_type[ext] = by_type.get(ext, 0) + 1

    # files by date (count per day)
    by_date_counts = {}
    for d in data:
        imported = d.get('imported_at')
        if imported:
            try:
                dt = datetime.fromisoformat(imported)
                key = dt.date().isoformat()
                by_date_counts[key] = by_date_counts.get(key, 0) + 1
            except Exception:
                pass

    # Prepare by_date structure sorted by date
    if by_date_counts:
        sorted_items = sorted(by_date_counts.items())
        by_date = { 'labels': [k for k,_ in sorted_items], 'data': [v for _,v in sorted_items] }
    else:
        by_date = { 'labels': [], 'data': [] }
    
    stats = {
        'total_docs': total_docs,
        'total_size': total_size,
        'total_words': total_words,
        'last_import': last_import.isoformat() if last_import else None,
        'by_type': by_type,
        'by_date': by_date
    }
    return jsonify(stats)


@app.route('/api/admin/files', methods=['GET'])
@check_admin
def admin_files():
    """Get list of indexed files with optional search."""
    q = request.args.get('q', '').strip().lower()
    data = []
    
    if os.path.exists(DATA_JSON):
        try:
            with open(DATA_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception:
            data = []
    
    if q:
        filtered = []
        for item in data:
            if q in item.get('filename', '').lower() or q in json.dumps(item.get('lemmas', {})).lower():
                filtered.append(item)
        data = filtered
    
    return jsonify(data)


@app.route('/api/admin/upload', methods=['POST'])
@check_admin
def upload():
    """Upload files/folders and process them."""
    files = request.files.getlist('files')
    if not files:
        return jsonify({'error': 'No files provided'}), 400
    
    saved_paths = []
    for f in files:
        if not f or f.filename == '':
            continue
        
        # Normalize filename
        fname = f.filename.replace('\\', '/').lstrip('/')
        dest = os.path.join(app.config['UPLOAD_FOLDER'], fname)
        parent = os.path.dirname(dest)
        
        if parent and not os.path.exists(parent):
            os.makedirs(parent, exist_ok=True)
        
        try:
            f.save(dest)
            saved_paths.append(dest)
        except Exception:
            base = os.path.basename(fname)
            dest2 = os.path.join(app.config['UPLOAD_FOLDER'], base)
            f.save(dest2)
            saved_paths.append(dest2)
    
    # Filter by selected types
    types = request.form.getlist('types')
    if types:
        types = [t.lower().lstrip('.') for t in types]
        filtered = [p for p in saved_paths if os.path.splitext(p)[1].lower().lstrip('.') in types]
    else:
        filtered = saved_paths
    
    # Determine whether to save to main index or temporary (save=false)
    save_flag = request.form.get('save', 'true').lower() != 'false'
    
    # Use a temporary file for the new processing to avoid overwriting the main index immediately
    temp_json = os.path.join('data', 'temp_processing.json')
    
    # Process and index (writes to temp_json)
    result = process_and_index(filtered, temp_json)
    new_items = result.get('indexed', [])

    # Save to DB (best-effort) only if save_flag True
    if save_flag:
        try:
            models.save_indexed(new_items)
        except Exception as e:
            print(f"DB save warning: {e}")
        
        # Merge with existing DATA_JSON
        existing_data = []
        if os.path.exists(DATA_JSON):
            try:
                with open(DATA_JSON, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            except Exception:
                existing_data = []
        
        # Create a dict of existing items keyed by path to avoid duplicates
        # We use path as unique identifier
        data_map = {item.get('path'): item for item in existing_data}
        
        # Update/Add new items
        for item in new_items:
            data_map[item.get('path')] = item
            
        # Convert back to list
        merged_data = list(data_map.values())
        
        # Write back to DATA_JSON
        try:
            with open(DATA_JSON, 'w', encoding='utf-8') as f:
                json.dump(merged_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"JSON save error: {e}")
            
        # Update result summary to reflect total (optional, but maybe confusing if we return total stats)
        # For the response, we probably want to show stats of *just uploaded* files, which 'result' already has.
    
    # Return per-file details as well
    files_info = []
    for item in new_items:
        files_info.append({
            'filename': item.get('filename'),
            'path': item.get('path'),
            'size': item.get('size'),
            'type': item.get('type'),
            'pages': item.get('pages'),
            'characters': item.get('characters'),
            'word_count': item.get('word_count')
        })
    return jsonify({
        'message': 'Files processed successfully',
        'summary': result.get('summary'),
        'top': result.get('top'),
        'wordcloud': result.get('wordcloud'),
        'files': files_info
    })



@app.route('/api/admin/file_stats', methods=['GET'])
@check_admin
def file_stats():
    """Return per-file detailed statistics (lemmas and counts).
    If file is present in the JSON index, return its lemmas and metadata.
    """
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'error': 'filename required'}), 400

    data = []
    if os.path.exists(DATA_JSON):
        try:
            with open(DATA_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception:
            data = []

    for item in data:
        if item.get('filename') == filename:
            return jsonify({
                'filename': item.get('filename'),
                'path': item.get('path'),
                'size': item.get('size'),
                'type': item.get('type'),
                'pages': item.get('pages'),
                'characters': item.get('characters'),
                'word_count': item.get('word_count'),
                'lemmas': item.get('lemmas'),
                'text_sample': item.get('text_sample')
            })

    return jsonify({'error': 'File not found in index'}), 404


@app.route('/api/admin/view', methods=['GET'])
@check_admin
def view_file():
    """Return full extracted text for a file (search in uploads or index)."""
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'error': 'filename required'}), 400

    # Search in index
    data = []
    if os.path.exists(DATA_JSON):
        try:
            with open(DATA_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception:
            data = []

    for item in data:
        if item.get('filename') == filename:
            path = item.get('path')
            text = ''
            try:
                text = extract_text(path)
            except Exception:
                text = ''
            return jsonify({'filename': filename, 'text': text})

    # Not found in index: try to locate in uploads folder
    for root, dirs, files in os.walk(app.config['UPLOAD_FOLDER']):
        if filename in files:
            path = os.path.join(root, filename)
            try:
                text = extract_text(path)
            except Exception:
                text = ''
            return jsonify({'filename': filename, 'text': text})

    return jsonify({'error': 'File not found'}), 404


@app.route('/api/admin/delete', methods=['POST'])
@check_admin
def delete_file():
    """Delete a file from index and uploads."""
    data = request.get_json() or {}
    filename = data.get('filename')
    
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400
    
    # Remove from JSON
    try:
        if os.path.exists(DATA_JSON):
            with open(DATA_JSON, 'r', encoding='utf-8') as f:
                file_data = json.load(f)
            new_data = [d for d in file_data if d.get('filename') != filename]
            with open(DATA_JSON, 'w', encoding='utf-8') as f:
                json.dump(new_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    # Remove file from uploads
    for root, dirs, files in os.walk(app.config['UPLOAD_FOLDER']):
        if filename in files:
            try:
                os.remove(os.path.join(root, filename))
            except Exception:
                pass
    
    return jsonify({'message': 'File deleted'})


@app.route('/api/admin/download', methods=['GET'])
@check_admin
def download_file():
    """Download a file."""
    path = request.args.get('path')
    if path and os.path.exists(path):
        return send_file(path, as_attachment=True)
    return jsonify({'error': 'File not found'}), 404


# === Client Routes ===
@app.route('/api/search', methods=['GET'])
@check_auth
def search():
    """Search in indexed lemmas."""
    q = request.args.get('q', '').strip().lower()
    mode = request.args.get('mode', 'or')
    
    # Map 'all_words' to 'and' for consistency with frontend
    if mode == 'all_words':
        mode = 'and'
    
    results = []
    
    if os.path.exists(DATA_JSON) and q:
        try:
            with open(DATA_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception:
            data = []
        
        terms = [t.strip() for t in q.split() if t.strip()]
        
        for file_item in data:
            lemmas = file_item.get('lemmas', {})
            matched = False
            count = 0
            
            if mode == 'exact':
                # Exact match: all terms must match exactly as a phrase
                full_text = file_item.get('cleaned_text', '').lower()
                if q in full_text:
                    count = full_text.count(q)
                    matched = True
            elif mode == 'and':
                # AND mode: all terms must be present
                if all(lemmas.get(t, 0) > 0 for t in terms):
                    count = sum(lemmas.get(t, 0) for t in terms)
                    matched = True
            else:  # 'or' mode (default)
                # OR mode: at least one term must be present
                count = sum(lemmas.get(t, 0) for t in terms)
                if count > 0:
                    matched = True
            
            if matched:
                # Prepare words data for wordcloud (convert to list of [word, freq])
                words_list = [[k, v] for k, v in lemmas.items()]
                
                results.append({
                    'name': file_item.get('filename'),
                    'filename': file_item.get('filename'),
                    'path': file_item.get('path'),
                    'type': file_item.get('type'),
                    'size': file_item.get('size'),
                    'num_pages': file_item.get('pages'),
                    'word_count': file_item.get('word_count'),
                    'characters': file_item.get('characters'),
                    'date_import': file_item.get('imported_at') or file_item.get('date_import'),
                    'count': count,
                    'context': file_item.get('text_sample', ''),
                    'words': words_list
                })

        # If query is short or no lemma-based results, try substring search
        if q and (len(q) <= 1 or len(results) == 0):
            for file_item in data:
                txt = (file_item.get('text_sample') or '').lower()
                if q in txt:
                    # avoid duplicates
                    if not any(r['filename'] == file_item.get('filename') for r in results):
                        words_list = [[k, v] for k, v in file_item.get('lemmas', {}).items()]
                        results.append({
                            'name': file_item.get('filename'),
                            'filename': file_item.get('filename'),
                            'path': file_item.get('path'),
                            'type': file_item.get('type'),
                            'size': file_item.get('size'),
                            'num_pages': file_item.get('pages'),
                            'word_count': file_item.get('word_count'),
                            'characters': file_item.get('characters'),
                            'date_import': file_item.get('imported_at') or file_item.get('date_import'),
                            'count': 0,
                            'context': file_item.get('text_sample', ''),
                            'words': words_list
                        })

    return jsonify({'results': results, 'query': q})


@app.route('/api/wordcloud', methods=['GET'])
@check_auth
def get_wordcloud():
    """Get wordcloud image path."""
    wc_path = 'static/wordclouds/wordcloud.png'
    if os.path.exists(wc_path):
        return jsonify({'path': wc_path})
    return jsonify({'path': None})


# === Health Check ===
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)

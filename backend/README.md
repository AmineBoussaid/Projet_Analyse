# Backend - API Flask

API REST pour l'analyse et l'indexation de fichiers textuels.

## 🚀 Installation

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m spacy download fr_core_news_sm
```

## 🔨 Démarrage

```powershell
python app.py
# Serveur sur http://localhost:5000
```

## 📝 Routes API

### Authentication
- `POST /api/login` - Connexion (sélection de rôle)
- `POST /api/logout` - Déconnexion

### Admin Routes
- `POST /api/admin/upload` - Upload et traitement de fichiers
- `GET /api/admin/files?q=search` - Liste des fichiers indexés
- `GET /api/admin/stats` - Statistiques globales
- `POST /api/admin/delete` - Supprimer un fichier
- `GET /api/admin/download?path=...` - Télécharger un fichier

### Client Routes
- `GET /api/search?q=query&mode=or|and|exact` - Recherche dans l'index
- `GET /api/wordcloud` - URL du nuage de mots

### Santé
- `GET /api/health` - Vérification du serveur

## 🗂️ Structure

```
backend/
├── app.py           # Application Flask + routes
├── processors.py    # Pipeline NLP
├── models.py        # Modèles SQLAlchemy
├── requirements.txt # Dépendances
├── data/
│   ├── texts.json  # Index JSON
│   └── index.db    # Base SQLite
├── uploads/        # Fichiers uploadés
└── static/
    └── wordclouds/
        └── wordcloud.png
```

## 🔧 Configuration

### Authentification

Les routes admin et client utilisent le header HTTP `X-Role`:

```javascript
// Frontend envoie
headers: {
  'X-Role': 'admin' // ou 'user'
}
```

### Limite d'upload

```python
MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB
```

## 🐛 Dépannage

**Port 5000 déjà utilisé**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**spaCy ne charge pas**
```powershell
python -m spacy download fr_core_news_sm
```

**CORS errors**
- Vérifier que `flask-cors` est installé
- CORS est activé globalement via `CORS(app)`

## 📦 Fichiers Clés

- `app.py` : Contient toutes les routes API
- `processors.py` : Extraction, nettoyage, lemmatisation
- `models.py` : Modèles DB (File, Lemma)

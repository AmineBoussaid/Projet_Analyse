# Frontend - Application React

Interface utilisateur moderne pour l'analyse de fichiers textuels.

## 🚀 Installation

```powershell
cd frontend
npm install
```

## 🔨 Démarrage

```powershell
npm start
# Application sur http://localhost:3000
```

## 📁 Structure

```
frontend/
├── package.json
├── public/
│   └── index.html
└── src/
    ├── pages/
    │   ├── Login.jsx              # Sélection de rôle
    │   ├── AdminImport.jsx        # Upload et traitement
    │   ├── AdminManage.jsx        # Gestion des documents
    │   ├── AdminStats.jsx         # Statistiques
    │   └── ClientSearch.jsx       # Recherche client
    ├── components/
    │   └── Layout.jsx             # Header + navbar
    ├── App.jsx                    # Routage principal
    └── index.jsx                  # Point d'entrée
```

## 🔐 Authentification

### Flux de Login

1. Utilisateur clique sur Admin ou User dans Login.jsx
2. Appel `POST /api/login` au backend
3. Role + token sauvegardés en `localStorage`
4. Redirection vers la page appropriée

### Headers d'API

Chaque requête inclut:
```javascript
headers: {
  'X-Role': localStorage.getItem('userRole'),
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

## 🎨 Pages

### Login
- Sélection de rôle (Admin/User)
- Design hero avec icônes
- Pas de validation - simple choix

### AdminImport
- Upload de fichiers (drag & drop)
- Sélection des types de fichiers
- Affichage des résultats (stats, top lemmes, wordcloud)

### AdminManage
- Liste des documents indexés
- Recherche par nom ou lemme
- Actions: télécharger, supprimer
- Aperçu du texte et lemmes principaux

### AdminStats
- Cartes statistiques (docs, taille, mots)
- Répartition par type de fichier
- Dernier import
- Bouton actualiser

### ClientSearch
- Barre de recherche hero
- 3 modes: OU, ET, Phrase exacte
- Affichage des résultats avec occurrence count
- Wordcloud intégré

## 🔄 Communication Backend

### Axios Configuration

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'X-Role': localStorage.getItem('userRole')
  }
});
```

### Exemples d'Appels

**Login**
```javascript
const response = await axios.post('http://localhost:5000/api/login', { role: 'admin' });
localStorage.setItem('token', response.data.token);
```

**Upload**
```javascript
const formData = new FormData();
formData.append('files', file);
formData.append('types', 'txt');

await axios.post('http://localhost:5000/api/admin/upload', formData, {
  headers: { 'X-Role': 'admin' }
});
```

**Recherche**
```javascript
const response = await axios.get('http://localhost:5000/api/search', {
  params: { q: 'terme', mode: 'or' },
  headers: { 'X-Role': 'user' }
});
```

## 📦 Build

```powershell
npm run build
# Crée le dossier build/ optimisé pour production
```

Servir avec:
```powershell
npx serve -s build -l 3000
```

## 🐛 Dépannage

**CORS errors**
- Vérifier que backend a `flask-cors`
- Vérifier le proxy dans `package.json`

**Blanc blanc page**
- Ouvrir DevTools > Console pour les erreurs
- Vérifier que backend démarre bien sur 5000

**Import d'un composant échoue**
```javascript
// Vérifier l'import/export
export function MyComponent() { ... }
import { MyComponent } from './path/MyComponent';
```

## 🚀 Structure des Styles

- `App.css` : Styles globaux, responsive
- `pages/*.css` : Styles spécifiques par page
- `components/Layout.css` : Header/navbar

Palette:
- **Primaire** : #667eea (Indigo)
- **Secondaire** : #764ba2 (Violet)
- **Gradient** : #667eea → #764ba2

## 📋 Checklist Avant Deploy

- [ ] `.env` configuré avec l'URL backend
- [ ] Backend accessible sur http://localhost:5000
- [ ] `npm install` complété
- [ ] Test des deux rôles (admin/user)
- [ ] Wordcloud génération
- [ ] Recherche fonctionnelle
- [ ] Suppression/téléchargement OK
- [ ] Responsive test sur mobile

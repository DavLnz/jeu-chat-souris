# 🐱 Le Chat et la Souris 🐭

Un jeu vidéo pour enfants : un chat poursuit une souris à travers différents
environnements (chambre, appartement, maison, jardin, rue). Jouable sur
**iOS** et **Android** (tactile) ainsi que sur ordinateur (clavier + souris).

## Lancer le jeu

Le jeu est en HTML5 pur, aucune installation n'est nécessaire :

1. Ouvre le fichier `index.html` dans un navigateur (Safari sur iOS, Chrome sur Android, ou n'importe quel navigateur de bureau).
2. Sur mobile : menu → « Ajouter à l'écran d'accueil » pour jouer en plein écran comme une application.

Pour héberger le jeu en ligne, il suffit de déployer les fichiers statiques
(`index.html`, `style.css`, `game.js`) sur n'importe quel hébergement web
(GitHub Pages, Netlify, Vercel, etc.).

## Comment jouer

- **Mobile** : glisse ton doigt sur l'écran, le chat se dirige vers ton doigt.
- **Ordinateur** : flèches directionnelles, ZQSD ou WASD (ou clic de souris).
- Attrape le plus de souris possible en **60 secondes**.
- Tous les **5 souris attrapées**, l'environnement change et la souris devient plus rapide.
- Ton record est sauvegardé localement sur l'appareil.

## Structure du projet

```
jeu-chat-souris/
├── index.html   # page du jeu (écrans accueil / fin de partie)
├── style.css    # interface plein écran adaptée au tactile
├── game.js      # moteur du jeu (canvas, IA de la souris, niveaux, sons)
└── README.md
```

## Publier sur l'App Store / le Play Store

Le jeu peut être emballé en application native avec [Capacitor](https://capacitorjs.com/) :

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Le Chat et la Souris" com.exemple.chatetsouris --web-dir .
npx cap add ios
npx cap add android
npx cap sync
```

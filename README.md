# 🌾 SONGHO — Jeu Traditionnel Camerounais

Implémentation web du **Songho**, jeu de stratégie traditionnel des peuples **Ewondo et Bulu** du Cameroun, aussi connu sous le nom de Songo.

---

## 🎮 Présentation

Le Songho est un jeu de société à 2 joueurs appartenant à la famille des jeux de **semailles** (mancala).  
Il se joue sur un plateau de **2 rangées de 7 cases**, avec **70 graines** au total.  
Le but est de capturer **40 graines ou plus** avant son adversaire.

---

## 📁 Structure du projet

```
songho/
├── songho.html   → Structure de la page (HTML)
├── songho.css    → Mise en page et design (CSS)
└── songho.js     → Logique du jeu (JavaScript)
```

---

## 🚀 Lancer le jeu en local

1. Télécharger ou cloner le projet
2. Mettre les 3 fichiers dans le même dossier
3. Ouvrir `songho.html` dans un navigateur (Chrome, Firefox…)

Aucune installation requise.

---

## 📜 Règles du jeu

### Mise en place
- 2 joueurs : **Nord** (en haut) et **Sud** (en bas)
- 2 rangées de 7 cases, chacune contenant **5 graines** au départ
- Le joueur Sud commence

### Semaille
1. Choisir une case de son camp contenant au moins 1 graine
2. Ramasser toutes les graines de cette case
3. Les déposer une par une :
   - Dans **son camp** : de droite à gauche
   - Dans le **camp adverse** : de gauche à droite
4. Si on possède **plus de 13 graines**, on saute la case de départ au premier passage

### Captures
- La **dernière graine** posée atterrit dans le camp adverse (sauf case 1)
- Si cette case contient **1, 2 ou 3 graines** (donc 2, 3 ou 4 après dépôt) → **capture**
- On continue à capturer les cases précédentes (vers la droite) si elles contiennent 2, 3 ou 4 graines
- **Interdit** de vider complètement le camp adverse

### Règle de solidarité
- Si l'adversaire n'a plus de graines, on doit lui envoyer **au moins 7 graines**
- Si c'est impossible → fin de partie

### Interdit
- Semer **1 ou 2 graines** chez l'adversaire en partant de la **case 7** est interdit *(sauf solidarité)*

### Fin de partie
| Condition | Résultat |
|---|---|
| Un joueur atteint **40 graines** | Ce joueur gagne |
| Moins de **10 graines** sur le plateau | Fin immédiate |
| Solidarité impossible | Fin immédiate |
| Égalité (≤ 39 chacun) | Match nul |

---

## 🛠️ Technologies utilisées

- HTML5
- CSS3
- JavaScript (Vanilla)

---

## 👨‍💻 Auteur

Projet réalisé dans le cadre d'un travail pratique en développement web.
nom: KISSIME KISSIME PRINCE NATHAN
matricule: 24G2151

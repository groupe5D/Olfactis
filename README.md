# Olfactis — Diffuseur olfactif

Olfactis est un diffuseur d'odeurs piloté depuis un navigateur. L'interface web permet d'ouvrir et de fermer deux vannes d'odeur, avec une vanne d'air neutre qui prend le relais automatiquement. Chaque activation est enregistrée pour assurer la traçabilité des séances, et un rapport peut être exporté en PDF.

👉 **[Essayer la démo en ligne](https://groupe5d.github.io/Olfactis/)**
La démo fonctionne sans diffuseur. Les actions sont simulées dans le navigateur.

## Contenu du dépôt

| Dossier | Contenu |
|---|---|
| `interface/` | Interface web (`index.html`) et serveur Node.js (`server.js`) qui communique avec l'Arduino |
| `arduino/olfactis/` | Programme à téléverser sur la carte Arduino Uno |
| `docs/` | Version démo de l'interface, publiée avec GitHub Pages |

## Fonctionnement

Le navigateur envoie les commandes au serveur local (`server.js`). Le serveur les transmet à l'Arduino par câble USB, au format `PIN:ETAT` (par exemple `7:1` pour ouvrir la vanne 1). L'Arduino commande ensuite les relais qui ouvrent ou ferment les électrovannes.

Quand une vanne d'odeur est ouverte, la vanne d'air neutre se ferme. Quand les deux vannes d'odeur sont fermées, l'air neutre se rouvre automatiquement.

## Matériel et câblage

| Broche Arduino | Relais | Rôle |
|---|---|---|
| D7 | IN1 | Vanne 1 — Odeur A |
| D6 | IN2 | Vanne 2 — Odeur B |
| D5 | IN3 | Vanne 3 — Air neutre |

Matériel utilisé : une carte Arduino Uno, un module relais, trois électrovannes et un câble USB.

## Installation

### 1. Prérequis

Installez [Node.js](https://nodejs.org) (version LTS) et l'[IDE Arduino](https://www.arduino.cc/en/software).

### 2. Téléverser le programme Arduino

Ouvrez `arduino/olfactis/olfactis.ino` dans l'IDE Arduino. Branchez la carte, sélectionnez « Arduino Uno » et le bon port, puis cliquez sur « Téléverser ».

Notez le nom du port affiché dans l'IDE (par exemple `COM5` sous Windows ou `/dev/ttyUSB0` sous Linux et macOS). Fermez ensuite le moniteur série, sinon le serveur ne pourra pas se connecter.

### 3. Configurer le port

Ouvrez `interface/server.js` et modifiez cette ligne si votre port est différent :

```js
const PORT_COM = 'COM5';
```

### 4. Installer les dépendances

Ouvrez un terminal dans le dossier `interface` et lancez :

```bash
npm install
```

### 5. Lancer l'interface

Toujours dans le dossier `interface` :

```bash
node server.js
```

Le terminal affiche « Serveur démarré ». Ouvrez ensuite **http://localhost:3000** dans votre navigateur. L'indicateur en haut à droite passe au vert dès la première commande envoyée.

## Utilisation

Au lancement, renseignez le patient, le numéro de séance et le thérapeute. Vous pouvez ensuite activer chaque vanne à la main ou programmer une durée avec la minuterie. L'historique des activations s'affiche dans la section « Traçabilité » et peut être exporté en PDF.

L'historique est enregistré dans `interface/tracabilite.json`. Ce fichier est exclu du dépôt (voir `.gitignore`) car il peut contenir des données de patients.

## En cas de problème

**« Arduino non connecté »** : vérifiez le port dans `server.js`, le câble USB, et que le moniteur série de l'IDE Arduino est bien fermé. Le serveur retente la connexion toutes les 2 secondes.

**Les vannes fonctionnent à l'envers** : certains modules relais s'activent à l'état bas, d'autres à l'état haut. Modifiez `RELAIS_ACTIF_BAS` en haut du programme Arduino.

## Auteurs

Clara Liotier, Mathilde Leroy, Lena Sanchez, Roman Randazo, Coraline Maujean, Gabin Pereira — [SUPBIOTECH], 2026.

## Licence

Ce projet est distribué sous licence MIT.

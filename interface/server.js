const express = require('express');
const { SerialPort } = require('serialport');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT_COM = 'COM5';
const BAUD_RATE = 9600;
const LOG_FILE = path.join(__dirname, 'tracabilite.json');

let vanne1 = false;
let vanne2 = false;
let tempsDebut = { 1: null, 2: null };

let arduino;
let arduinoOk = false;

function connecterArduino() {
  try {
    arduino = new SerialPort({ path: PORT_COM, baudRate: BAUD_RATE });
    arduino.on('open', () => {
      arduinoOk = true;
      console.log('✓ Arduino connecté sur ' + PORT_COM);
    });
    arduino.on('error', (err) => {
      arduinoOk = false;
      console.error('✗ Erreur série:', err.message);
      // Reconnexion automatique après 2 secondes
      setTimeout(connecterArduino, 2000);
    });
    arduino.on('close', () => {
      arduinoOk = false;
      console.log('⚠ Arduino déconnecté, reconnexion...');
      setTimeout(connecterArduino, 2000);
    });
  } catch (err) {
    arduinoOk = false;
    console.error('✗ Impossible d\'ouvrir ' + PORT_COM + ':', err.message);
    setTimeout(connecterArduino, 2000);
  }
}

connecterArduino();

// Envoie une commande et attend un délai avant la suivante
function envoyerPin(pin, state) {
  return new Promise((resolve, reject) => {
    if (!arduino || !arduinoOk) return reject(new Error('Arduino non connecté'));
    const msg = `${pin}:${state}\n`;
    arduino.write(msg, (err) => {
      if (err) return reject(err);
      console.log('→ Arduino:', msg.trim());
      // Délai de 100ms pour laisser l'Arduino traiter
      setTimeout(resolve, 100);
    });
  });
}

function chargerLog() {
  try {
    if (fs.existsSync(LOG_FILE)) return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch (e) {}
  return [];
}

function sauvegarderLog(data) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));
}

function formatDuree(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}min ${s % 60}s`;
  if (m > 0) return `${m}min ${s % 60}s`;
  return `${s}s`;
}

app.post('/control', async (req, res) => {
  const { pin, state } = req.body;

  if (!arduino || !arduinoOk) {
    return res.status(500).json({ error: 'Arduino non connecté' });
  }

  const log = chargerLog();
  const now = new Date();

  if (pin === 7) {
    if (state === 1 && !vanne1) {
      tempsDebut[1] = now;
      log.push({ id: Date.now(), vanne: 'Vanne 1 — Odeur A', pin: 7, debut: now.toISOString(), fin: null, duree: null });
      vanne1 = true;
    } else if (state === 0 && vanne1) {
      const duree = tempsDebut[1] ? formatDuree(now - tempsDebut[1]) : '—';
      const entry = log.filter(e => e.pin === 7 && e.fin === null).pop();
      if (entry) { entry.fin = now.toISOString(); entry.duree = duree; }
      vanne1 = false; tempsDebut[1] = null;
    }
  }

  if (pin === 6) {
    if (state === 1 && !vanne2) {
      tempsDebut[2] = now;
      log.push({ id: Date.now(), vanne: 'Vanne 2 — Odeur B', pin: 6, debut: now.toISOString(), fin: null, duree: null });
      vanne2 = true;
    } else if (state === 0 && vanne2) {
      const duree = tempsDebut[2] ? formatDuree(now - tempsDebut[2]) : '—';
      const entry = log.filter(e => e.pin === 6 && e.fin === null).pop();
      if (entry) { entry.fin = now.toISOString(); entry.duree = duree; }
      vanne2 = false; tempsDebut[2] = null;
    }
  }

  sauvegarderLog(log);

  const etatAir = (vanne1 || vanne2) ? 0 : 1;

  try {
    await envoyerPin(pin, state);
    await envoyerPin(5, etatAir);
    res.json({ ok: true, pin, state, air: etatAir });
  } catch (err) {
    console.error('✗ Erreur envoi:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/log', (req, res) => res.json(chargerLog()));
app.delete('/log', (req, res) => { sauvegarderLog([]); res.json({ ok: true }); });

const PORT_HTTP = 3000;
app.listen(PORT_HTTP, () => {
  console.log('');
  console.log('====================================');
  console.log('  Serveur démarré !');
  console.log('  http://localhost:' + PORT_HTTP);
  console.log('====================================');
});

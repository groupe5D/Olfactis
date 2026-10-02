/*
  Olfactis — Diffuseur olfactif
  Reçoit des commandes sur le port série au format "PIN:ETAT\n"
  Exemple : "7:1" ouvre la vanne 1, "7:0" la ferme.

  D7 -> IN1 : Vanne 1 (odeur A)
  D6 -> IN2 : Vanne 2 (odeur B)
  D5 -> IN3 : Vanne 3 (air neutre)
*/

const int VANNE_1 = 7;
const int VANNE_2 = 6;
const int VANNE_AIR = 5;

// Beaucoup de modules relais s'activent à l'état LOW.
// Mettre à false si votre module s'active à l'état HIGH.
const bool RELAIS_ACTIF_BAS = true;

String buffer = "";

void appliquer(int pin, int etat) {
  bool actif = (etat == 1);
  digitalWrite(pin, (actif != RELAIS_ACTIF_BAS) ? HIGH : LOW);
}

void setup() {
  Serial.begin(9600);
  pinMode(VANNE_1, OUTPUT);
  pinMode(VANNE_2, OUTPUT);
  pinMode(VANNE_AIR, OUTPUT);
  appliquer(VANNE_1, 0);
  appliquer(VANNE_2, 0);
  appliquer(VANNE_AIR, 1); // air neutre actif au démarrage
}

void loop() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      int sep = buffer.indexOf(':');
      if (sep > 0) {
        int pin = buffer.substring(0, sep).toInt();
        int etat = buffer.substring(sep + 1).toInt();
        if (pin == VANNE_1 || pin == VANNE_2 || pin == VANNE_AIR) {
          appliquer(pin, etat);
        }
      }
      buffer = "";
    } else if (c != '\r') {
      buffer += c;
    }
  }
}

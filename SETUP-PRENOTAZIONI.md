# 📅 Sistema di prenotazione → Google Calendar + Drive

Il form "Prenota la prova gratuita" può collegarsi direttamente al tuo **Google
Calendar** (crea l'evento) e a **Google Drive** (registra ogni richiesta in un
Foglio Google). Non serve nessun server: usiamo **Google Apps Script**.

> Finché non completi questi passaggi, il form funziona comunque in modalità
> **fallback**: apre una email precompilata verso `ciao@polaris-bz.it`.

---

## 1. Crea il Foglio Google (registro richieste)

1. Vai su [sheets.new](https://sheets.new) e crea un foglio (es. *"Prenotazioni Polaris"*).
2. Dalla barra degli indirizzi copia l'**ID** del foglio:
   `https://docs.google.com/spreadsheets/d/`**`QUESTO_È_L_ID`**`/edit`

## 2. (Opzionale) Scegli il calendario

- Per usare il **calendario principale**: non devi fare nulla.
- Per un calendario dedicato: crea un calendario su Google Calendar →
  *Impostazioni del calendario* → copia l'**ID calendario**
  (qualcosa tipo `xxxxx@group.calendar.google.com`).

## 3. Crea lo script

1. Vai su [script.google.com](https://script.google.com) → **Nuovo progetto**.
2. Cancella il contenuto e incolla **tutto** il file [`apps-script/Codice.gs`](./apps-script/Codice.gs).
3. In cima, compila la sezione `CONFIG`:
   ```js
   const CONFIG = {
     CALENDAR_ID: '',                         // '' = calendario principale
     SHEET_ID: 'INCOLLA_QUI_L_ID_DEL_FOGLIO',
     SHEET_NAME: 'Prenotazioni',
     NOTIFY_EMAIL: 'ciao@polaris-bz.it',      // '' per disattivare
     DURATION_MIN: 60,
   };
   ```
4. **Salva** (icona dischetto).

## 4. Pubblica come Web App

1. In alto a destra: **Deploy → Nuova distribuzione**.
2. Tipo (icona ⚙️): **App web**.
3. Imposta:
   - *Esegui come*: **Io** (il tuo account)
   - *Chi ha accesso*: **Chiunque**
4. **Distribuisci** → autorizza i permessi (Calendar, Sheets, Gmail) al primo avvio.
5. Copia la **URL dell'app web** (finisce con `/exec`).

## 5. Collega il sito

Apri `index.html`, cerca questa riga (verso la fine, nello `<script>`):

```js
const BOOKING_ENDPOINT = '';
```

e incolla la tua URL:

```js
const BOOKING_ENDPOINT = 'https://script.google.com/macros/s/XXXXXXXX/exec';
```

Salva e ricarica la pagina. **Fatto!** 🎉

---

## ✅ Come verificare

1. Compila il form sul sito e invia.
2. Controlla:
   - 📆 **Google Calendar** → trovi l'evento *"Prova gratuita – Nome"* con invito alla famiglia.
   - 📊 **Foglio Google** → nuova riga con tutti i dati.
   - 📧 La famiglia riceve l'invito; tu ricevi la notifica (se `NOTIFY_EMAIL` è attivo).

## 🔧 Note

- **Aggiorni lo script?** Rifai *Deploy → Gestisci distribuzioni → Modifica → Nuova
  versione*, così la URL `/exec` resta la stessa.
- **Fasce orarie**: nel sito sono 14:00–17:00 (lun–ven). Cambiale nel blocco
  `#slotGroup` dentro `index.html`.
- **Privacy**: collega la checkbox "privacy" alla tua informativa reale.
- **Anti-spam** (facoltativo): puoi aggiungere Google reCAPTCHA o un campo nascosto
  "honeypot" se ricevi richieste indesiderate.

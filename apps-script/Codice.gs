/**
 * POLARIS - Backend prenotazioni
 * Collega il form del sito a Google Calendar + Google Drive (Sheet).
 *
 * Cosa fa, ad ogni prenotazione:
 *   1) crea un evento "Prova gratuita" sul tuo Google Calendar (con invito alla famiglia)
 *   2) aggiunge una riga al Google Sheet su Drive (registro richieste)
 *   3) (opzionale) invia una mail di notifica alla segreteria
 *
 * Vedi SETUP-PRENOTAZIONI.md per la procedura passo-passo.
 */

// ====================== CONFIGURAZIONE ======================
const CONFIG = {
  // ID del calendario su cui creare gli eventi.
  // Lascia '' per usare il calendario principale del tuo account.
  CALENDAR_ID: '',

  // ID del Google Sheet dove registrare le richieste (dalla URL del foglio).
  // Esempio URL: https://docs.google.com/spreadsheets/d/<QUESTO_E_L_ID>/edit
  SHEET_ID: '1Uam9oh5mGYvI7l5xEh0PyfSAapqb92ROjx5I8soDa6w',
  SHEET_NAME: 'Prenotazioni',

  // Email che riceve la notifica della nuova richiesta ('' per disattivare).
  NOTIFY_EMAIL: 'ciao@polaris-bz.it',

  // Durata dell'incontro in minuti.
  DURATION_MIN: 60,
};
// ============================================================


function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Validazione minima
    const required = ['nome', 'email', 'data', 'slot'];
    for (const k of required) {
      if (!data[k]) return json({ ok: false, error: 'Campo mancante: ' + k });
    }

    const range = slotRange_(data);
    const event = createCalendarEvent_(data, range.start, range.end);
    appendToSheet_(data, event);
    notify_(data);
    sendConfirmation_(data, range.start, range.end);

    return json({ ok: true, eventId: event.getId() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Disponibilità + test. /exec?date=YYYY-MM-DD restituisce le fasce già occupate.
const SLOTS = ['14:00', '15:00', '16:00', '17:00'];

function doGet(e) {
  try {
    const date = e && e.parameter && e.parameter.date;
    if (!date) return json({ ok: true, message: 'Polaris booking endpoint attivo.' });
    return json({ ok: true, date: date, busy: busySlots_(date) });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function busySlots_(date) {
  const cal = CONFIG.CALENDAR_ID
    ? CalendarApp.getCalendarById(CONFIG.CALENDAR_ID)
    : CalendarApp.getDefaultCalendar();
  const [Y, M, D] = date.split('-').map(Number);
  const events = cal.getEvents(new Date(Y, M - 1, D, 0, 0, 0), new Date(Y, M - 1, D, 23, 59, 59));
  return SLOTS.filter(function (s) {
    const [h, m] = s.split(':').map(Number);
    const start = new Date(Y, M - 1, D, h, m, 0);
    const end = new Date(start.getTime() + CONFIG.DURATION_MIN * 60000);
    return events.some(function (ev) { return ev.getStartTime() < end && ev.getEndTime() > start; });
  });
}


function slotRange_(d) {
  const [Y, M, D] = d.data.split('-').map(Number);
  const [h, m] = d.slot.split(':').map(Number);
  const start = new Date(Y, M - 1, D, h, m, 0);
  const end = new Date(start.getTime() + CONFIG.DURATION_MIN * 60000);
  return { start: start, end: end };
}

function createCalendarEvent_(d, start, end) {
  const cal = CONFIG.CALENDAR_ID
    ? CalendarApp.getCalendarById(CONFIG.CALENDAR_ID)
    : CalendarApp.getDefaultCalendar();

  const title = 'Prova gratuita - ' + d.nome + (d.classe ? ' (' + d.classe + ')' : '');
  const description =
    'Richiesta dal sito Polaris\n\n' +
    'Nome: ' + d.nome + '\n' +
    'Telefono: ' + (d.telefono || '-') + '\n' +
    'Email: ' + d.email + '\n' +
    'Classe: ' + (d.classe || '-') + '\n' +
    'Messaggio: ' + (d.messaggio || '-');

  const event = cal.createEvent(title, start, end, {
    description: description,
    guests: d.email,
    sendInvites: true,
  });
  event.setLocation('Polaris Doposcuola, Bolzano');
  return event;
}


function appendToSheet_(d, event) {
  if (!CONFIG.SHEET_ID) return;
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_NAME);
    sh.appendRow(['Timestamp', 'Nome', 'Telefono', 'Email', 'Classe', 'Giorno', 'Orario', 'Messaggio', 'Origine', 'Event ID']);
  }
  sh.appendRow([
    new Date(), d.nome, d.telefono || '', d.email, d.classe || '',
    d.data, d.slot, d.messaggio || '', d.origine || 'Sito', event.getId(),
  ]);
}


function notify_(d) {
  if (!CONFIG.NOTIFY_EMAIL) return;
  const subject = 'Nuova prova gratuita - ' + d.nome + ' (' + d.data + ' ' + d.slot + ')';
  const body =
    'Nuova richiesta di prova gratuita:\n\n' +
    'Nome: ' + d.nome + '\n' +
    'Telefono: ' + (d.telefono || '-') + '\n' +
    'Email: ' + d.email + '\n' +
    'Classe: ' + (d.classe || '-') + '\n' +
    'Giorno: ' + d.data + '  Orario: ' + d.slot + '\n' +
    'Messaggio: ' + (d.messaggio || '-');
  MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, subject, body);
}


// Email di conferma alla famiglia, con testo motivante + evento .ics allegato
function sendConfirmation_(d, start, end) {
  try {
    if (!d.email) return;
    const first = String(d.nome || '').trim().split(' ')[0] || 'ciao';
    const giorno = d.data.split('-').reverse().join('/'); // GG/MM/AAAA
    const orario = d.slot;

    const subject = 'La tua prova gratuita al doposcuola Polaris e confermata!';
    const body =
      'Ciao ' + first + ',\n\n' +
      'che bella notizia: hai prenotato la tua giornata di prova gratuita al doposcuola Polaris!\n\n' +
      'Ti aspettiamo ' + giorno + ' alle ' + orario + ', nel cuore di Bolzano.\n' +
      'Sara l\'occasione perfetta per conoscere i nostri educatori, vedere gli spazi e scoprire come\n' +
      'rendere lo studio piu sereno, organizzato e... persino piacevole.\n\n' +
      'Crediamo che ogni ragazzo possa fare la differenza quando trova l\'ambiente giusto e qualcuno\n' +
      'che crede in lui. Non vediamo l\'ora di iniziare questo percorso insieme.\n\n' +
      'Cosa portare? Solo la voglia di provare: a tutto il resto pensiamo noi.\n\n' +
      'In allegato trovi l\'invito da salvare sul tuo calendario (file .ics): un tocco e ci sei.\n' +
      'Per qualsiasi cosa, rispondi pure a questa email.\n\n' +
      'A prestissimo,\n' +
      'Il team di Polaris Doposcuola\n' +
      'Bolzano - Alto Adige / Suedtirol';

    const ics = buildIcs_(start, end);
    const attachment = Utilities.newBlob(ics, 'text/calendar', 'Prova-Polaris.ics');

    MailApp.sendEmail({
      to: d.email,
      subject: subject,
      body: body,
      name: 'Polaris Doposcuola',
      attachments: [attachment],
    });
  } catch (e) {
    // Non blocchiamo la prenotazione se l'email di conferma fallisce
  }
}

function buildIcs_(start, end) {
  const fmt = (dt) => Utilities.formatDate(dt, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  const uid = Utilities.getUuid() + '@polaris-bz.it';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Polaris Doposcuola//Prenotazioni//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + uid,
    'DTSTAMP:' + fmt(new Date()),
    'DTSTART:' + fmt(start),
    'DTEND:' + fmt(end),
    'SUMMARY:Prova gratuita - Polaris Doposcuola',
    'DESCRIPTION:Giornata di prova gratuita al doposcuola Polaris, nel cuore di Bolzano.',
    'LOCATION:Polaris Doposcuola, Bolzano',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

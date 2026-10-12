'use strict';

/*
 * Öffentlicher Besuchszähler für MUHR Immobilien.
 * Ein Besuch wird maximal einmal pro Browser-Tab/Sitzung gezählt:
 * kein zusätzlicher Treffer beim Blättern oder beim Wechsel
 * zwischen Webseite, Impressum und Datenschutz.
 *
 * /hit = neuen Besuch zählen; /get = Zählerstand nur anzeigen.
 * Abacus speichert die Zahl serverseitig. Im sessionStorage wird
 * ausschließlich ein temporäres Merkzeichen für diesen Tab gespeichert.
 */
(() => {
  const value = document.getElementById('website-visit-count');
  const validSite = /^(www\.)?muhr-immobilien\.de$/i.test(window.location.hostname);
  if (!validSite) {
    if (value) value.textContent = 'Nur auf der Live-Webseite verfügbar';
    return;
  }

  const storageKey = 'muhr-immobilien:besuch-gezaehlt:v2';
  let alreadyCounted = false;

  try {
    alreadyCounted = window.sessionStorage.getItem(storageKey) === '1';
    if (!alreadyCounted) {
      // Vor der Anfrage markieren: Ein sofortiger Seitenwechsel darf
      // nicht versehentlich zwei /hit-Anfragen auslösen.
      window.sessionStorage.setItem(storageKey, '1');
    }
  } catch (_) {
    // Manche Browser sperren Web-Speicher. In diesem Fall zumindest
    // interne Seitenwechsel und Neuladen anhand des Referrers erkennen.
    try {
      const previous = new URL(document.referrer);
      alreadyCounted = previous.origin === window.location.origin;
    } catch (_) {
      alreadyCounted = false;
    }
  }

  // Kein Zähler auf der eigentlichen Webseite: nach dem ersten Besuch
  // hier keine erneute Verbindung zum externen Dienst herstellen.
  if (alreadyCounted && !value) return;

  const namespaceAndKey = 'muhr-immobilien-de/aufrufe-seit-2026-10-12';
  const operation = alreadyCounted ? 'get' : 'hit';
  const endpoint = `https://abacus.jasoncameron.dev/${operation}/${namespaceAndKey}`;

  fetch(endpoint, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'no-referrer'
  })
    .then(response => {
      if (!response.ok) throw new Error('Zähldienst nicht erreichbar');
      return response.json();
    })
    .then(data => {
      const count = Number(data.value);
      if (!Number.isSafeInteger(count) || count < 0) throw new Error('Ungültiger Zählerstand');
      if (value) value.textContent = new Intl.NumberFormat('de-DE').format(count);
    })
    .catch(() => {
      if (value) value.textContent = 'Zurzeit nicht verfügbar';
    });
})();

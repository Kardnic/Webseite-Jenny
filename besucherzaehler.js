'use strict';

/*
 * Öffentlicher, einfacher Aufrufzähler für MUHR Immobilien.
 * Gezählt werden vollständige Seitenaufrufe (keine einzelnen Personen).
 * Weder Cookies noch LocalStorage werden zu diesem Zweck gesetzt.
 * Aufrufzahlen werden nicht im GitHub-Repository gespeichert.
 *
 * /hit erhöht den Wert, /get würde ihn nur auslesen. Damit zählt ein
 * Besuch im Impressum ebenfalls als normaler Webseitenaufruf.
 */
(() => {
  const value = document.getElementById('website-visit-count');
  const validSite = /^(www\.)?muhr-immobilien\.de$/i.test(window.location.hostname);
  if (!validSite) {
    if (value) value.textContent = 'Nur auf der Live-Webseite verfügbar';
    return;
  }

  const endpoint = 'https://abacus.jasoncameron.dev/hit/muhr-immobilien-de/aufrufe-seit-2026-10-12';
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
      // Die reguläre Webseite darf niemals wegen eines externen Zähldienstes ausfallen.
      if (value) value.textContent = 'Zurzeit nicht verfügbar';
    });
})();

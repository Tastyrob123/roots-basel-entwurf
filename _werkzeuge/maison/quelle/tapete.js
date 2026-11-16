/* Tapete des Kontrollpanels · roots: das Wurzelwerk des «r» aus dem gemeinsamen Kleid (_werkzeuge/oberflaeche/kleid/roots.css, --wo-tapete) einmal
   als Bild mit doppelter Dichte rechnen (Regel 55: ein SVG-Muster kostet am Handy beim ersten Scrollen ein Bild über 33 ms, das gerechnete Bild nicht).
   node quelle/tapete.js → quelle/tapete-<art>@2x.png (hell: Messing leise auf Leinen, dunkel: Messing auf Flaschengrün) */
const path = require('path');
const pw = require('/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright');
const MUSTER = (deck, punkt) => `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><g fill="none" stroke="#C8A36B" stroke-opacity="${deck}" stroke-width="1" stroke-linecap="round"><path d="M60 34v22M60 56c-4 6-10 9-17 11M60 56c4 6 10 9 17 11M60 56v16M51 62c-3 4-4 8-4 12M69 62c3 4 4 8 4 12"/></g><circle cx="60" cy="30" r="1.4" fill="#C8A36B" fill-opacity="${punkt}"/></svg>`;
(async () => {
  const b = await pw.chromium.launch({ headless: true });
  for (const [art, deck, punkt] of [['hell', .3, .42], ['dunkel', .2, .3]]) {
    const page = await b.newPage({ viewport: { width: 120, height: 120 }, deviceScaleFactor: 2 });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${MUSTER(deck, punkt)}`);
    await page.screenshot({ path: path.join(__dirname, `tapete-${art}@2x.png`), omitBackground: true, clip: { x: 0, y: 0, width: 120, height: 120 } });
    await page.close();
  }
  await b.close();
})();

/*
  Builds one self-contained file — paper-plane-park.html — with the CSS and
  JavaScript inlined. Handy for emailing or AirDropping the game to a phone.

      node build-standalone.js
*/
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');

// bake the voice clips in as data URIs so the single file still speaks
let voicepack = '';
try {
  const packSrc = read('voicepack.js');
  const map = JSON.parse(packSrc.slice(packSrc.indexOf('{'), packSrc.lastIndexOf('}') + 1));
  const inlined = {};
  for (const [text, url] of Object.entries(map)) {
    const b64 = fs.readFileSync(path.join(dir, url)).toString('base64');
    inlined[text] = 'data:audio/mpeg;base64,' + b64;
  }
  voicepack = '<script>\nwindow.VOICE_PACK = ' + JSON.stringify(inlined) + ';\n</script>';
} catch (e) {
  console.warn('voicepack not inlined: ' + e.message);
}

const html = read('index.html')
  .replace('<link rel="stylesheet" href="styles.css">', () => '<style>\n' + read('styles.css') + '\n</style>')
  .replace('<script src="voicepack.js"></script>', () => voicepack)
  .replace('<script src="game.js"></script>', () => '<script>\n' + read('game.js') + '\n</script>');

const out = path.join(dir, 'paper-plane-park.html');
fs.writeFileSync(out, html);
console.log('Wrote ' + out + ' (' + Math.round(html.length / 1024) + ' KB)');

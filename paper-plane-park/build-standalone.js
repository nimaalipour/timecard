/*
  Builds one self-contained file — paper-plane-park.html — with the CSS and
  JavaScript inlined. Handy for emailing or AirDropping the game to a phone.

      node build-standalone.js
*/
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');

const html = read('index.html')
  .replace('<link rel="stylesheet" href="styles.css">', () => '<style>\n' + read('styles.css') + '\n</style>')
  .replace('<script src="game.js"></script>', () => '<script>\n' + read('game.js') + '\n</script>');

const out = path.join(dir, 'paper-plane-park.html');
fs.writeFileSync(out, html);
console.log('Wrote ' + out + ' (' + Math.round(html.length / 1024) + ' KB)');

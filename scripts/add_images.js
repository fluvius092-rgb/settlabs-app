const fs = require('fs');
const path = 'data/scps.js';
let s = fs.readFileSync(path, 'utf8');

// id -> [file, credit]
const map = {
  'SCP-354':  ['scp-354.jpg',  'Tashiya'],
  'SCP-575':  ['scp-575.jpg',  'Unknown SCP Wiki contributor'],
  'SCP-783':  ['scp-783.jpg',  'aismallard'],
  'SCP-940':  ['scp-940.jpg',  'Unknown SCP Wiki contributor'],
  'SCP-3812': ['scp-3812.jpg', 'LurkD'],
  'SCP-4666': ['scp-4666.jpg', 'djkaktus'],
  'SCP-3301': ['scp-3301.png', 'Tufto'],
  'SCP-4999': ['scp-4999.png', 'PeppersGhost'],
  'SCP-5000': ['scp-5000.jpg', 'Tanhony'],
  'SCP-020':  ['scp-020.jpg',  'Unknown SCP Wiki contributor'],
  'SCP-060':  ['scp-060.jpg',  'Unknown SCP Wiki contributor'],
  'SCP-469':  ['scp-469.jpg',  'Unknown SCP Wiki contributor'],
  'SCP-745':  ['scp-745.jpg',  'Unknown SCP Wiki contributor'],
  'SCP-835':  ['scp-835.jpg',  'Unknown SCP Wiki contributor'],
  'SCP-1529': ['scp-1529.jpg', 'Unknown SCP Wiki contributor'],
  'SCP-2191': ['scp-2191.webp','Unknown SCP Wiki contributor'],
  'SCP-3480': ['scp-3480.jpg', 'NASA'],
  'SCP-4100': ['scp-4100.png', 'Unknown SCP Wiki contributor'],
  'SCP-4200': ['scp-4200.png', 'Unknown SCP Wiki contributor'],
  'SCP-4290': ['scp-4290.jpg', 'Unknown SCP Wiki contributor'],
  'SCP-4514': ['scp-4514.jpg', 'Unknown SCP Wiki contributor'],
  'SCP-6500': ['scp-6500.jpg', 'Placeholder'],
  'SCP-804':  ['scp-804.JPG',  'Unknown SCP Wiki contributor'],
  'SCP-956':  ['scp-956.jpg',  'Unknown SCP Wiki contributor'],
  'SCP-966':  ['scp-966.png',  'Unknown SCP Wiki contributor'],
  'SCP-993':  ['scp-993.png',  'Unknown SCP Wiki contributor'],
  'SCP-1730': ['scp-1730.jpg', 'Unknown SCP Wiki contributor'],
  'SCP-2935': ['scp-2935.jpg', 'Unknown SCP Wiki contributor'],
  'SCP-2030': ['scp-2030.jpg', 'Unknown SCP Wiki contributor'],
  'SCP-009':  ['scp-009.png',  'Unknown SCP Wiki contributor'],
};

let added = 0, skipped = 0;
for (const [id, [file, credit]] of Object.entries(map)) {
  const re = new RegExp(`(\\{ id:"${id.replace(/[-]/g,'\\-')}",[^\\n]*?power_en:"[^"]*")( \\})`, 'g');
  const before = s;
  s = s.replace(re, (m, body, tail) => {
    if (body.includes('image:"assets/cards/')) { skipped++; return m; }
    const wikiId = id.toLowerCase();
    return `${body}, image:"assets/cards/${file}", imageCredit:"${credit}", imageLicense:"CC BY-SA 3.0", imageSource:"https://scp-wiki.wikidot.com/${wikiId}"${tail}`;
  });
  if (s !== before) added++;
  else if (!s.includes(`image:"assets/cards/${file}"`)) console.log('NO MATCH:', id);
}
fs.writeFileSync(path, s);
console.log(`added=${added} skipped=${skipped}`);

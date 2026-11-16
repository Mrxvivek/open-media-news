import fs from 'fs';

const code = fs.readFileSync('js/data.js', 'utf-8');
const keys = [];
const keyRegex = /^\s*([a-zA-Z0-9_]+)\s*:\s*(\[|\{)/gm;
let m;
while ((m = keyRegex.exec(code)) !== null) {
  keys.push(m[1]);
}
console.log('Keys in GC_DATA:', keys);

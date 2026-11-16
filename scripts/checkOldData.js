import fs from 'fs';
const vm = await import('vm');

const dataCode = fs.readFileSync('js/data.js', 'utf-8');
const sandbox = {};
vm.createContext(sandbox);
const GC_DATA = vm.runInContext(dataCode + '\n;GC_DATA;', sandbox);

const oldDates = [];
const placeholderTexts = [];

GC_DATA.articles.forEach(a => {
  const d = a.date || a.published || '';
  if (d.includes('2024') || d.includes('2025') || d.includes('August') || d.includes('Aug')) {
    oldDates.push({ id: a.id, title: a.title, date: d, category: a.category });
  }
  const text = `${a.title} ${a.summary || ''} ${a.description || ''} ${a.body || ''}`;
  if (/placeholder|lorem|dummy|sample/i.test(text)) {
    placeholderTexts.push({ id: a.id, title: a.title, category: a.category });
  }
});

console.log('Articles with old dates (pre-Nov 2026):', oldDates.length);
oldDates.forEach(o => console.log('  -', o.category, ':', o.date, o.title));

console.log('Articles with placeholder text:', placeholderTexts.length);
placeholderTexts.forEach(p => console.log('  -', p.category, ':', p.title));

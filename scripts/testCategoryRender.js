import fs from 'fs';

// Read data.js
const dataCode = fs.readFileSync('js/data.js', 'utf-8');
const vm = await import('vm');
const sandbox = {};
vm.createContext(sandbox);
const GC_DATA = vm.runInContext(dataCode + '\n;GC_DATA;', sandbox);

console.log('GC_DATA.articles length:', GC_DATA.articles.length);
['Business', 'IT', 'Cyber Security', 'AI'].forEach(cat => {
  const items = GC_DATA.articles.filter(a => a.category === cat);
  console.log(`\n=== Category: [${cat}] (${items.length} items) ===`);
  items.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i+1}. [${item.published || item.date}] [${item.domain}] ${item.title}`);
  });
});

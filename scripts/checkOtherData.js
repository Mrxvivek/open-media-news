import fs from 'fs';
const vm = await import('vm');

const dataCode = fs.readFileSync('js/data.js', 'utf-8');
const sandbox = {};
vm.createContext(sandbox);
const GC_DATA = vm.runInContext(dataCode + '\n;GC_DATA;', sandbox);

['heroStories', 'trending', 'events', 'ads'].forEach(key => {
  const list = GC_DATA[key] || [];
  console.log(`\n=== Checking GC_DATA.${key} (${list.length} items) ===`);
  list.forEach(item => {
    const d = item.date || item.published || '';
    const text = `${item.title || item.name} ${item.summary || item.description || item.body || ''}`;
    console.log(`  [${d || 'NO_DATE'}] ${item.title || item.name} (${item.category || item.type || ''})`);
  });
});

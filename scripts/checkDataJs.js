import fs from 'fs';

const content = fs.readFileSync('js/data.js', 'utf-8');
const articlesMatch = content.match(/articles:\s*(\[[\s\S]*?\n\s*\]),/);
if (articlesMatch) {
  const articles = eval(articlesMatch[1]);
  console.log('Total articles in js/data.js:', articles.length);
  const byCat = {};
  articles.forEach(a => {
    byCat[a.category] = (byCat[a.category] || 0) + 1;
  });
  console.log('By category:', byCat);
  console.log('Sample Business:', articles.find(a => a.category === 'Business'));
  console.log('Sample IT:', articles.find(a => a.category === 'IT'));
  console.log('Sample Cyber Security:', articles.find(a => a.category === 'Cyber Security'));
  console.log('Sample AI:', articles.find(a => a.category === 'AI'));
} else {
  console.log('articles array not found');
}

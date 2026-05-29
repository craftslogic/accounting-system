const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/app');
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let updated = content.replace(/behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/g, 'behavior="padding"');
  updated = updated.replace(/behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}/g, 'behavior="padding"');
  if (content !== updated) {
    fs.writeFileSync(f, updated);
    console.log('Updated ' + f);
  }
});

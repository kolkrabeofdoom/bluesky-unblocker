const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

// Extract all IDs from HTML
const htmlIds = new Set();
let m;
const htmlRe = /id="([^"]+)"/g;
while ((m = htmlRe.exec(html)) !== null) htmlIds.add(m[1]);

// Extract all getElementById calls from JS
const jsIds = [];
const jsRe = /getElementById\('([^']+)'\)/g;
while ((m = jsRe.exec(js)) !== null) jsIds.push(m[1]);

const missing = jsIds.filter(id => !htmlIds.has(id));
if (missing.length === 0) {
    console.log('OK: All', jsIds.length, 'getElementById calls have matching HTML ids.');
} else {
    console.log('MISSING ids in HTML:');
    missing.forEach(id => console.log(' -', id));
}

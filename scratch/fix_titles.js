const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, '../frontend/src/app/(dashboard)/dashboard');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const breadcrumbRegex = /<div className=\{?["']?breadcrumb["']?\}?>\s*(?:<span[^>]*>.*?<\/span>\s*)*<span className=\{?["']?(?:styles\.)?breadCurrent["']?\}?>([^<]+)<\/span>\s*<\/div>/gs;

let modifiedCount = 0;

walkDir(DASHBOARD_DIR, (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  let hasH1 = content.includes('<h1') || content.includes('<h1 ');
  let match;

  // We loop to replace all breadcrumbs in the file (usually just 1)
  while ((match = breadcrumbRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const breadCurrentText = match[1].trim();

    if (hasH1) {
      // If it already has an H1, just remove the breadcrumb entirely!
      content = content.replace(fullMatch, '');
    } else {
      // If it doesn't have an H1, replace the breadcrumb with a beautiful H1 title!
      const replacement = `<h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>${breadCurrentText}</h1>`;
      content = content.replace(fullMatch, replacement);
    }
  }

  // Clean up any double empty lines created by removal
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.relative(DASHBOARD_DIR, filePath)}`);
    modifiedCount++;
  }
});

console.log(`\nSuccessfully fixed titles in ${modifiedCount} files!`);

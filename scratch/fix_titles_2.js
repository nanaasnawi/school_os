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

// Regex to match <div className={styles.breadcrumb}> ... <span className={styles.breadCurrent}>Title</span> </div>
// and <div className="breadcrumb"> ...
const breadcrumbRegex = /<div className=\{[^}]*breadcrumb[^}]*\}>\s*(?:<span[^>]*>.*?<\/span>\s*)*<span className=\{[^}]*breadCurrent[^}]*\}>([^<]+)<\/span>\s*<\/div>/gs;

let modifiedCount = 0;

walkDir(DASHBOARD_DIR, (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  let hasH1 = content.includes('<h1') || content.includes('<h1 ');
  let match;

  while ((match = breadcrumbRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const breadCurrentText = match[1].trim();

    if (hasH1) {
      content = content.replace(fullMatch, '');
    } else {
      const replacement = `<h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>${breadCurrentText}</h1>`;
      content = content.replace(fullMatch, replacement);
    }
  }

  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.relative(DASHBOARD_DIR, filePath)}`);
    modifiedCount++;
  }
});

console.log(`\nSuccessfully fixed titles in ${modifiedCount} files!`);

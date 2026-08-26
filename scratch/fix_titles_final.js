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

const breadcrumbRegex = /<div className=\{?["']?(?:styles\.)?breadcrumb["']?[^>]*>[\s\S]*?<\/div>/g;

let modifiedCount = 0;

walkDir(DASHBOARD_DIR, (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We only want to remove the breadcrumb if the file already has an <h1 page title
  let hasH1 = content.includes('<h1');

  if (hasH1) {
    // Replace all occurrences of the breadcrumb div
    content = content.replace(breadcrumbRegex, '');
    
    // Clean up empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated and cleaned: ${path.relative(DASHBOARD_DIR, filePath)}`);
      modifiedCount++;
    }
  } else {
    // If it doesn't have an H1, let's promote the breadCurrent text!
    // This case was mostly handled by fix_titles.js, but just in case:
    let match;
    const breadCurrentRegex = /<div className=\{?["']?(?:styles\.)?breadcrumb["']?[^>]*>[\s\S]*?<span[^>]*breadCurrent[^>]*>([^<]+)<\/span>[\s\S]*?<\/div>/g;
    
    while ((match = breadCurrentRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const breadCurrentText = match[1].trim();
      
      const replacement = `<h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>${breadCurrentText}</h1>`;
      content = content.replace(fullMatch, replacement);
    }
    
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated and promoted H1: ${path.relative(DASHBOARD_DIR, filePath)}`);
      modifiedCount++;
    }
  }
});

console.log(`\nSuccessfully fixed final titles in ${modifiedCount} files!`);

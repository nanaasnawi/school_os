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

const paginationHookStr = `
  // --- Client-Side Pagination ---
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  React.useEffect(() => { 
    setCurrentPage(1); 
  }, [filtered.length]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  // ------------------------------
`;

const paginationUIStr = `        <div className={styles.pagination} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Menampilkan {paginated.length} dari total {filtered.length} hasil</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="btn btn-secondary btn-sm"
            >
              Prev
            </button>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0.5rem' }}>Halaman {currentPage} dari {totalPages}</span>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>`;

let modifiedCount = 0;

walkDir(DASHBOARD_DIR, (filePath) => {
  if (!filePath.endsWith('page.tsx')) return;
  // Skip dapodik since we just did it manually
  if (filePath.includes('dapodik')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Ensure the file has a "const filtered = ..." array
  if (!content.includes('const filtered = ')) return;
  // Ensure it's not already paginated
  if (content.includes('const paginated =')) return;

  // 2. Inject pagination hooks right before the "return (" statement
  content = content.replace(/\n\s*return \(\s*<div/g, '\n' + paginationHookStr + '\n  return (\n    <div');

  // 3. Replace {filtered.map( with {paginated.map(
  content = content.replace(/\{filtered\.map\(/g, '{paginated.map(');

  // 4. Replace the old pagination footer
  const paginationFooterRegex = /<div className=\{?["']?(?:styles\.)?pagination["']?[^>]*>[\s\S]*?<\/div>/g;
  content = content.replace(paginationFooterRegex, paginationUIStr);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated pagination: ${path.relative(DASHBOARD_DIR, filePath)}`);
    modifiedCount++;
  }
});

console.log(`\nSuccessfully injected pagination in ${modifiedCount} files!`);

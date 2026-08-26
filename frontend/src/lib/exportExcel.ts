import * as XLSX from 'xlsx';

/**
 * Utility helper to export structured JSON data to a formatted Excel (.xlsx) file.
 */
export function exportToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName: string = 'Sheet1'
) {
  if (!data || data.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Calculate dynamic column widths based on content length
  const keys = Object.keys(data[0] || {});
  const colWidths = keys.map(key => {
    const maxLength = Math.max(
      key.length,
      ...data.map(row => String(row[key] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLength + 4, 14), 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
}

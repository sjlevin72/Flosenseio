import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const absPath = path.join(__dirname, 'SampleData.xlsx');
console.log('[test-xlsx] Reading:', absPath);

try {
  const workbook = xlsx.readFile(absPath);
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  console.log('[test-xlsx] Loaded rows:', rows.length);
  console.log('[test-xlsx] First row:', rows[0]);
} catch (err) {
  console.error('[test-xlsx] Error:', err);
}

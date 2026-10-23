import { readFile, writeFile } from 'node:fs/promises';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/embed-template.mjs input.pdf output.js');
}

const pdf = await readFile(inputPath);
const base64 = pdf.toString('base64');
await writeFile(outputPath, `window.GO_TEMPLATE_PDF_BASE64="${base64}";\n`);

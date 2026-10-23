const scriptUrl = document.currentScript.src;
const $ = (id) => document.getElementById(id);
const fields = { name: $('studentName'), location: $('location'), departure: $('departure'), returnDate: $('returnDate') };
const templateOptions = {
  village: { label: 'Village', pageIndex: 0, artwork: new URL('./assets/template-village.png', scriptUrl).href },
  city: { label: 'City', pageIndex: 1, artwork: new URL('./assets/template-city.png', scriptUrl).href }
};
let currentTemplate = 'village';
let portraitData = '';
let toastTimer;

function escapeXml(value) { return value.replace(/[<>&'\"]/g, (char) => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', "'":'&apos;', '"':'&quot;' }[char])); }
function dateDisplay(value) { if (!value) return 'DATE'; const [year, month, day] = value.split('-'); return `${month}/${day}/${year.slice(-2)}`; }
function safe(value, fallback) { return escapeXml((value || fallback).trim()); }
function splitName(value) {
  const raw = (value || 'First and Last Name').trim().toUpperCase();
  const words = raw.split(/\s+/);
  if (raw.length <= 16 || words.length === 1) return [raw];
  let bestIndex = 1;
  let smallestDifference = Infinity;
  for (let index = 1; index < words.length; index += 1) {
    const difference = Math.abs(words.slice(0, index).join(' ').length - words.slice(index).join(' ').length);
    if (difference < smallestDifference) { smallestDifference = difference; bestIndex = index; }
  }
  return [words.slice(0, bestIndex).join(' '), words.slice(bestIndex).join(' ')];
}
function nameMarkup(value) {
  const lines = splitName(value).map(escapeXml);
  if (lines.length === 1) return `<text x="375" y="1250" text-anchor="middle" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700">${lines[0]}</text>`;
  return `<text text-anchor="middle" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700"><tspan x="375" y="1210">${lines[0]}</tspan><tspan x="375" y="1288">${lines[1]}</tspan></text>`;
}
function bookmarkSvg() {
  const option = templateOptions[currentTemplate];
  const name = nameMarkup(fields.name.value);
  const tripLocation = safe(fields.location.value, 'Trip Location');
  const dates = `${dateDisplay(fields.departure.value)} - ${dateDisplay(fields.returnDate.value)}`;
  const portrait = portraitData ? `<image href="${portraitData}" x="187" y="497" width="375" height="420" preserveAspectRatio="xMidYMid slice" clip-path="url(#portraitClip)" />` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2.5in" height="8in" viewBox="0 0 750 2400" role="img" aria-label="Global Outreach personalized bookmark"><defs><clipPath id="portraitClip"><rect x="187" y="497" width="375" height="420" rx="18"/></clipPath></defs><image href="${option.artwork}" x="0" y="0" width="750" height="2400" preserveAspectRatio="none"/>${portrait}${name}<text x="375" y="1800" text-anchor="middle" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="700">${tripLocation}</text><text x="375" y="1930" text-anchor="middle" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="50" font-weight="700">${dates}</text></svg>`;
}
function render() { $('preview').innerHTML = bookmarkSvg(); $('saveState').textContent = 'Updated just now'; }
function showToast(message) { const toast = $('toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3600); }
function filename() { return `global-outreach-${(fields.name.value || 'bookmark').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'bookmark'}.pdf`; }
function decodeBase64(value) { const binary = atob(value); const bytes = new Uint8Array(binary.length); for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i); return bytes; }
function fittedSize(font, text, preferred, maximumWidth, minimum = 8) { let size = preferred; while (size > minimum && font.widthOfTextAtSize(text, size) > maximumWidth) size -= .25; return size; }
function drawCenteredText(page, text, centerX, y, font, preferredSize, maximumWidth) { const size = fittedSize(font, text, preferredSize, maximumWidth); const width = font.widthOfTextAtSize(text, size); page.drawText(text, { x: centerX - width / 2, y, font, size, color: PDFLib.rgb(1, 1, 1) }); }
function drawWrappedText(page, text, { x, y, width, font, size, color, lineHeight = size * 1.4 }) {
  const words = text.split(/\s+/); const lines = []; let line = '';
  words.forEach((word) => { const candidate = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate; else { if (line) lines.push(line); line = word; } });
  if (line) lines.push(line);
  lines.forEach((content, index) => page.drawText(content, { x, y: y - index * lineHeight, font, size, color }));
  return y - lines.length * lineHeight;
}
function roundedRectPath(context, width, height, radius) {
  context.beginPath(); context.moveTo(radius, 0); context.lineTo(width - radius, 0); context.quadraticCurveTo(width, 0, width, radius); context.lineTo(width, height - radius); context.quadraticCurveTo(width, height, width - radius, height); context.lineTo(radius, height); context.quadraticCurveTo(0, height, 0, height - radius); context.lineTo(0, radius); context.quadraticCurveTo(0, 0, radius, 0); context.closePath();
}
async function portraitPngBytes() {
  if (!portraitData) return null;
  const image = new Image();
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = portraitData; });
  const canvas = document.createElement('canvas'); canvas.width = 750; canvas.height = 840;
  const context = canvas.getContext('2d'); roundedRectPath(context, canvas.width, canvas.height, 36); context.clip();
  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const width = image.naturalWidth * scale; const height = image.naturalHeight * scale;
  context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}
function drawInstructionPage(pdf, regular, bold) {
  const page = pdf.addPage([612, 792]);
  const ink = PDFLib.rgb(.075, .235, .25); const muted = PDFLib.rgb(.30, .42, .40); const gold = PDFLib.rgb(.82, .70, .35); const pale = PDFLib.rgb(.94, .96, .93);
  page.drawRectangle({ x: 0, y: 672, width: 612, height: 120, color: ink });
  page.drawText('GLOBAL OUTREACH', { x: 54, y: 748, font: bold, size: 11, color: gold });
  page.drawText('Draft submission instructions', { x: 54, y: 704, font: bold, size: 27, color: PDFLib.rgb(1, 1, 1) });
  page.drawText('Temporary copy - replace this page with approved Print Services instructions.', { x: 54, y: 646, font: regular, size: 11, color: muted });
  page.drawRectangle({ x: 54, y: 525, width: 504, height: 92, color: pale, borderColor: PDFLib.rgb(.80, .85, .81), borderWidth: 1 });
  page.drawText('ORDER DETAILS', { x: 72, y: 591, font: bold, size: 9, color: muted });
  page.drawText((fields.name.value || 'Student name').trim(), { x: 72, y: 562, font: bold, size: 15, color: ink });
  page.drawText((fields.location.value || 'Trip location').trim(), { x: 72, y: 540, font: regular, size: 10, color: muted });
  page.drawText(`${dateDisplay(fields.departure.value)} - ${dateDisplay(fields.returnDate.value)}`, { x: 360, y: 562, font: bold, size: 11, color: ink });
  page.drawText(`${templateOptions[currentTemplate].label} background`, { x: 360, y: 540, font: regular, size: 10, color: muted });
  const steps = [
    ['1', 'Review your bookmark', 'Confirm the student name, trip location, dates, background, and portrait before submitting.'],
    ['2', 'Submit this complete PDF', 'Upload or send this two-page file through the current Print Services ordering process. Do not remove page 1.'],
    ['3', 'Provide the order quantity', 'Enter the requested number of bookmarks in the order form or include it with the production request.']
  ];
  let y = 485;
  steps.forEach(([number, heading, body]) => {
    page.drawCircle({ x: 68, y: y + 3, size: 12, color: ink });
    page.drawText(number, { x: 64.5, y: y - 1, font: bold, size: 9, color: PDFLib.rgb(1, 1, 1) });
    page.drawText(heading, { x: 94, y, font: bold, size: 14, color: ink });
    drawWrappedText(page, body, { x: 94, y: y - 21, width: 430, font: regular, size: 10, color: muted, lineHeight: 14 });
    y -= 92;
  });
  page.drawRectangle({ x: 54, y: 118, width: 504, height: 102, color: PDFLib.rgb(.98, .96, .88), borderColor: gold, borderWidth: 1 });
  page.drawText('PRINT SERVICES - PRODUCTION SPECS', { x: 72, y: 193, font: bold, size: 9, color: ink });
  page.drawText('Page 2 is the press-ready, one-up bookmark artwork.', { x: 72, y: 169, font: bold, size: 11, color: ink });
  page.drawText('Trim: 2.5 x 8 in   -   Bleed: 0.125 in all sides   -   Media: 2.75 x 8.25 in', { x: 72, y: 146, font: regular, size: 9.5, color: muted });
  page.drawText('Print at 100%. Use the embedded trim and bleed boxes; do not scale or crop page 2.', { x: 72, y: 128, font: regular, size: 9.5, color: muted });
  page.drawText('Page 1 of 2  -  Draft submission instructions', { x: 54, y: 54, font: regular, size: 8.5, color: muted });
}
async function downloadPdf() {
  const button = $('downloadPdf'); const original = button.innerHTML; button.disabled = true; button.textContent = 'Creating 2-page PDF…';
  try {
    const assetBytes = decodeBase64(window.GO_TEMPLATE_PDF_BASE64);
    const pdf = await PDFLib.PDFDocument.create();
    const regular = await pdf.embedFont(PDFLib.StandardFonts.Helvetica); const bold = await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
    drawInstructionPage(pdf, regular, bold);
    const [background] = await pdf.embedPdf(assetBytes, [templateOptions[currentTemplate].pageIndex]);
    const [design] = await pdf.embedPdf(assetBytes, [2]);
    const page = pdf.addPage([198, 594]);
    page.setCropBox(0, 0, 198, 594); page.setBleedBox(0, 0, 198, 594); page.setTrimBox(9, 9, 180, 576);
    page.drawPage(background, { x: 0, y: -19.8, width: 198, height: 633.6 });
    page.drawPage(design, { x: 9, y: 9, width: 180, height: 576 });
    const portraitBytes = await portraitPngBytes();
    if (portraitBytes) { const portrait = await pdf.embedPng(portraitBytes); page.drawImage(portrait, { x: 53.88, y: 364.92, width: 90, height: 100.8 }); }
    const nameLines = splitName(fields.name.value);
    if (nameLines.length === 1) drawCenteredText(page, nameLines[0], 99, 285, bold, 16, 122);
    else { drawCenteredText(page, nameLines[0], 99, 294.76, bold, 16, 122); drawCenteredText(page, nameLines[1], 99, 275.56, bold, 16, 122); }
    drawCenteredText(page, (fields.location.value || 'Trip Location').trim(), 99, 154.91, bold, 14.82, 132);
    drawCenteredText(page, `${dateDisplay(fields.departure.value)} - ${dateDisplay(fields.returnDate.value)}`, 99, 122.18, bold, 12.84, 142);
    pdf.setTitle(`Global Outreach Bookmark - ${fields.name.value || 'Student'}`); pdf.setCreator('Global Outreach Bookmark Studio');
    const bytes = await pdf.save(); const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a'); link.href = url; link.download = filename(); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Two-page full-bleed PDF downloaded.');
  } catch (error) { console.error(error); showToast('The PDF could not be created. Please reload and try again.'); }
  finally { button.disabled = false; button.innerHTML = original; }
}

Object.values(fields).forEach((field) => field.addEventListener('input', render));
document.querySelectorAll('.template-card').forEach((button) => button.addEventListener('click', () => { currentTemplate = button.dataset.template; document.querySelectorAll('.template-card').forEach((card) => { const active = card === button; card.classList.toggle('active', active); card.setAttribute('aria-checked', active); }); render(); }));
$('portrait').addEventListener('change', (event) => { const file = event.target.files[0]; if (!file) return; if (file.size > 8 * 1024 * 1024) { showToast('Please choose an image smaller than 8 MB.'); event.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => { portraitData = reader.result; $('photoStatus').textContent = file.name; $('removePhoto').hidden = false; render(); }; reader.readAsDataURL(file); });
$('removePhoto').addEventListener('click', () => { portraitData = ''; $('portrait').value = ''; $('photoStatus').textContent = 'No photo selected'; $('removePhoto').hidden = true; render(); });
$('downloadPdf').addEventListener('click', downloadPdf);
render();

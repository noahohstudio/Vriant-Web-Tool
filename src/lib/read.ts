// Reading an uploaded file in the browser: a PDF's own text (pdf.js), text recognition for photos and
// scanned PDFs (Tesseract), or plain text. Loaded only when a file is dropped; nothing leaves the device.
// Text recognition fetches its engine and English model from the jsDelivr CDN the first time (~5 MB, then cached).
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

export type ReadResult = { pages: string[]; images: string[]; via: 'pdf' | 'ocr' | 'text' };
export type ReadErrorCode = 'unsupported' | 'empty' | 'failed' | 'too-big';
export class ReadError extends Error {
  code: ReadErrorCode;
  constructor(code: ReadErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const MAX_PAGES = 20;
const MAX_BYTES = 40 * 1024 * 1024;

export function kindOf(file: File): 'pdf' | 'image' | 'text' | 'other' {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/.test(name)) return 'image';
  if (file.type.startsWith('text/') || /\.(txt|md|tex)$/.test(name)) return 'text';
  return 'other';
}

/** Read a sheet. `report` receives a short caption for each stage, for the scanning animation. */
export async function readSheetFile(file: File, report: (caption: string) => void): Promise<ReadResult> {
  if (file.size > MAX_BYTES) throw new ReadError('too-big', 'That file is over 40 MB. Try exporting a smaller PDF, or one page at a time.');
  const kind = kindOf(file);
  if (kind === 'text') {
    report('Reading the text');
    const text = await file.text();
    return { pages: text.split('\f'), images: [], via: 'text' };
  }
  if (kind === 'pdf') return readPdf(file, report);
  if (kind === 'image') {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const text = await recognize([img], report);
      return { pages: text, images: [url], via: 'ocr' };
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }
  throw new ReadError('unsupported', 'Vriant reads PDFs, photos (PNG or JPG) and text files.');
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ReadError('unsupported', 'This browser can’t open that image. Try a PNG or JPG (iPhone photos: Settings → Camera → Most Compatible).'));
    img.src = url;
  });
}

// ——— PDFs ———————————————————————————————————————————————————————

const SUP_DIGITS: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺' };

/** A page's text items back into lines. Raised small digits become superscripts (x²), and big vertical gaps blank lines. */
function pageText(items: TextItem[]): string {
  const lines: string[] = [];
  let line = '';
  let base: { y: number; h: number } | null = null;
  let lastEnd = 0;
  for (const it of items) {
    if (!it.str && !it.hasEOL) continue;
    const x = it.transform[4];
    const y = it.transform[5];
    const h = Math.abs(it.transform[3]) || it.height || 10;
    if (base && it.str) {
      const dy = y - base.y;
      const raised = h < base.h * 0.85 && dy > base.h * 0.18 && dy < base.h * 0.8 && Math.abs(x - lastEnd) < base.h;
      if (raised && /^[-+]?\d{1,3}$/.test(it.str.trim())) {
        line += [...it.str.trim()].map((c) => SUP_DIGITS[c] ?? c).join('');
        lastEnd = x + it.width;
        continue;
      }
      if (Math.abs(dy) > Math.max(h, base.h) * 0.6) {
        lines.push(line);
        if (Math.abs(dy) > base.h * 2.2) lines.push('');
        line = '';
      } else if (x - lastEnd > h * 0.2 && line && !/\s$/.test(line) && !/^\s/.test(it.str)) line += ' ';
    }
    if (it.str) {
      line += it.str;
      if (!base || Math.abs(y - base.y) > h * 0.6 || h >= base.h * 0.85) base = { y, h };
      lastEnd = x + it.width;
    }
    if (it.hasEOL) {
      lines.push(line);
      line = '';
      base = null;
    }
  }
  if (line) lines.push(line);
  return lines.map((l) => l.replace(/\s+/g, ' ').trim()).join('\n');
}

async function readPdf(file: File, report: (caption: string) => void): Promise<ReadResult> {
  report('Opening the PDF');
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let doc;
  try {
    doc = await task.promise;
  } catch (e) {
    const locked = e instanceof Error && e.name === 'PasswordException';
    throw new ReadError('failed', locked ? 'That PDF is password-protected. Remove the password and try again.' : 'That PDF couldn’t be opened — it may be damaged.');
  }
  const count = Math.min(doc.numPages, MAX_PAGES);
  const pages: string[] = [];
  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= count; i++) {
    report(count > 1 ? `Reading page ${i} of ${count}` : 'Reading the page');
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(pageText(content.items.filter((x): x is TextItem => 'str' in x)));
    // A picture of each page, for the Review screen (and for text recognition if the PDF is a scan).
    const view = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 1400 / view.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    canvases.push(canvas);
    page.cleanup();
  }
  await task.destroy();
  const images = await Promise.all(canvases.map(toUrl));
  const chars = pages.join('').replace(/\s/g, '').length;
  // A scanned PDF has pictures of text but no text layer: recognize it instead.
  if (chars < 25 * count) {
    const text = await recognize(canvases, report);
    return { pages: text, images, via: 'ocr' };
  }
  return { pages, images, via: 'pdf' };
}

const toUrl = (canvas: HTMLCanvasElement) =>
  new Promise<string>((resolve) => canvas.toBlob((b) => resolve(b ? URL.createObjectURL(b) : canvas.toDataURL('image/jpeg', 0.8)), 'image/jpeg', 0.82));

// ——— Text recognition ——————————————————————————————————————————————

async function recognize(images: (HTMLImageElement | HTMLCanvasElement)[], report: (caption: string) => void): Promise<string[]> {
  report('Loading text recognition — the first time takes a moment');
  let worker;
  try {
    const { createWorker } = await import('tesseract.js');
    worker = await createWorker('eng', 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'loading language traineddata' && m.progress < 1) report('Loading text recognition — the first time takes a moment');
      },
    });
  } catch {
    throw new ReadError('failed', 'Text recognition couldn’t load. Check your connection — or try a PDF with selectable text.');
  }
  try {
    const out: string[] = [];
    for (let i = 0; i < images.length; i++) {
      report(images.length > 1 ? `Recognizing text on page ${i + 1} of ${images.length}` : 'Recognizing the text');
      const { data } = await worker.recognize(images[i]);
      out.push(data.text ?? '');
    }
    return out;
  } finally {
    await worker.terminate();
  }
}

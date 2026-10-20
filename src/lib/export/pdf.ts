// Trình ghi PDF tối giản (dùng chung: Xưởng Lắp Ghép plan mục 11.2, Xưởng Cắt Giấy plan mục 7.4): mỗi trang = một ảnh JPEG phủ kín A4 (image XObject DCTDecode).
// Không thêm thư viện; chữ tiếng Việt đã được vẽ sẵn trên canvas nên không cần nhúng font.

export interface PdfPage { jpeg: Uint8Array; width: number; height: number }

const A4 = { w: 595.28, h: 841.89 };
const enc = new TextEncoder();

export function makePdf(pages: PdfPage[]): Uint8Array {
  const chunks: Uint8Array[] = [], offsets: number[] = [];
  let size = 0;
  const push = (b: Uint8Array) => { chunks.push(b); size += b.length; };
  const text = (s: string) => push(enc.encode(s));
  const obj = (num: number, body: () => void) => { offsets[num] = size; text(`${num} 0 obj\n`); body(); text('\nendobj\n'); };

  text('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'.replace(/[\u0080-ÿ]/g, '')); // tiêu đề (bỏ byte nhị phân để đơn giản)
  const n = pages.length;
  // đánh số: 1 catalog, 2 pages, rồi mỗi trang 3 đối tượng: page, content, image
  const pageNum = (i: number) => 3 + i * 3;
  obj(1, () => text('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => text(`<< /Type /Pages /Count ${n} /Kids [${pages.map((_, i) => `${pageNum(i)} 0 R`).join(' ')}] >>`));
  pages.forEach((pg, i) => {
    const p = pageNum(i), c = p + 1, im = p + 2;
    obj(p, () => text(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${c} 0 R >>`));
    const content = `q ${A4.w} 0 0 ${A4.h} 0 0 cm /Im${i} Do Q`;
    obj(c, () => text(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    obj(im, () => { text(`<< /Type /XObject /Subtype /Image /Width ${pg.width} /Height ${pg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpeg.length} >>\nstream\n`); push(pg.jpeg); text('\nendstream'); });
  });
  const total = 3 + n * 3;
  const xref = size;
  text(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let i = 1; i < total; i++) text(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  text(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(size);
  let o = 0;
  for (const ch of chunks) { out.set(ch, o); o += ch.length; }
  return out;
}

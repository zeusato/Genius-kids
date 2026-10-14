// Vector hoá ảnh nét raster 2048 → SVG; đo dung lượng và thời gian.
const potrace = require('potrace'); const sharp = require('sharp');
const fs = require('fs'); const zlib = require('zlib');
(async () => {
  for (const f of process.argv.slice(2)) {
    const png = await sharp(fs.readFileSync(f), { density: f.endsWith('.svg') ? (f.includes('scene') ? 144 : 2048) : 72 }).resize(2048, 2048).flatten({ background: '#fff' }).greyscale().png().toBuffer();
    const t = Date.now();
    potrace.trace(png, { threshold: 160, turdSize: 20, optTolerance: 0.4 }, (err, svg) => {
      if (err) throw err; const out = f.replace(/\.\w+$/, '.traced.svg'); fs.writeFileSync(out, svg);
      console.log(f.split('/').pop(), 'trace_ms', Date.now() - t, 'svg_bytes', svg.length, 'gzip', zlib.gzipSync(svg).length);
    });
  }
})();

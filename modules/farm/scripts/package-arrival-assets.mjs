import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root = new URL('../', import.meta.url);
const list = ['berry','welcome','tools',...[1,5,10,15,20,25].map(n=>`road-${n}`)];
for (const id of list) {
  const road = id.startsWith('road-');
  const base = road ? 'src/assets/roads/' : id === 'berry' ? 'src/assets/terrain/' : 'src/assets/ui/';
  const filename = id === 'tools' ? 'construction-tools-v1' : road ? id : `${id}-v1`;
  let image = sharp(fileURLToPath(new URL(`${base}${road ? 'source/' : ''}${filename}.png`, root)));
  if (road) image = image.resize(512, 512);
  if (id === 'berry') image = image.resize({ width: 512 });
  if (id === 'welcome') image = image.resize({ width: 960 });
  if (id === 'tools') image = image.resize(1024, 512);
  await image.webp({ quality: 90, alphaQuality: 100, effort: 4 }).toFile(fileURLToPath(new URL(`${base}${id === 'berry' ? 'optimized/' : ''}${filename}.webp`, root)));
  console.log(filename);
}

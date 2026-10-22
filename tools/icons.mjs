import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const dir = process.argv[2];
const b = await chromium.launch();
const jobs = [['icon.svg','icon-192.png',192],['icon.svg','icon-512.png',512],['icon-maskable.svg','maskable-512.png',512],['icon-maskable.svg','apple-touch-icon.png',180],['icon.svg','favicon-32.png',32]];
for (const [src,out,n] of jobs) {
  const svg = fs.readFileSync(`${dir}/${src}`,'utf8').replace(/width="\d+" height="\d+"/, `width="${n}" height="${n}"`);
  const p = await b.newPage({viewport:{width:n,height:n}});
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await p.waitForTimeout(150);
  await p.screenshot({path:`${dir}/${out}`, omitBackground:true});
  await p.close();
}
await b.close();

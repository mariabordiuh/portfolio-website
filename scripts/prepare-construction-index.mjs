import { readFile, writeFile } from 'node:fs/promises';

const indexPath = new URL('../dist/index.html', import.meta.url);
const title = 'Maria Bordiuh - brewing soon.';
const description = "Maria Bordiuh's new portfolio is currently under construction.";

let html = await readFile(indexPath, 'utf8');

html = html
  .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
  .replace(
    /<meta name="description" content=".*?" \/>/,
    `<meta name="description" content="${description}" />`,
  )
  .replace(/<meta name="robots" content=".*?" \/>/, '<meta name="robots" content="noindex, nofollow" />')
  .replace(
    /<meta property="og:title" content=".*?" \/>/,
    `<meta property="og:title" content="${title}" />`,
  )
  .replace(
    /<meta property="og:description" content=".*?" \/>/,
    `<meta property="og:description" content="${description}" />`,
  )
  .replace(
    /<meta name="twitter:title" content=".*?" \/>/,
    `<meta name="twitter:title" content="${title}" />`,
  )
  .replace(
    /<meta name="twitter:description" content=".*?" \/>/,
    `<meta name="twitter:description" content="${description}" />`,
  );

await writeFile(indexPath, html);

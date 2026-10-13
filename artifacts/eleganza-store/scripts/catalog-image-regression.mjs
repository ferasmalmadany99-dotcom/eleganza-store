import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');

const productCardMatch = appSource.match(
  /function ProductCard\([\s\S]*?(?=\nfunction ProductDetail\()/,
);

assert.ok(productCardMatch, 'ProductCard must remain defined in App.tsx');

const productCard = productCardMatch[0];

assert.match(
  productCard,
  /aspect-\[4\/5\][^"]*overflow-hidden/,
  'Product cards must preserve the 4:5 mobile crop without distortion',
);
assert.match(
  productCard,
  /className="h-full w-full object-cover"/,
  'Product images must fill the card with object-cover',
);
assert.match(
  productCard,
  /loading="lazy"/,
  'Catalog images, including off-screen cards, must use native lazy loading',
);
assert.match(
  productCard,
  /srcSet=\{`\$\{product\.image480\} 480w, \$\{product\.image960\} 960w`\}/,
  'Product cards must expose both 480w and 960w image candidates',
);
assert.match(
  productCard,
  /sizes="\(min-width: 1024px\) 25vw, \(min-width: 640px\) 50vw, 100vw"/,
  'Product cards must advertise their full viewport width on phones',
);
assert.match(
  appSource,
  /className="mt-8 grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-4"/,
  'The catalog must remain a single-column grid below the mobile breakpoint',
);

console.log('Catalog mobile image regression checks passed.');
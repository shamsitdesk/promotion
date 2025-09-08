
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://shamsitdesk.github.io/promo/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/promo"
  },
  {
    "renderMode": 2,
    "route": "/promo/print"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-NDJBKI3C.js"
    ],
    "route": "/promo/barcode"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 704, hash: 'aec793a7f8180a3b4b16cea679b35fd470764cdb87810b75dd802f75c676384c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1220, hash: '7293dbc446459e448c1810a902cbcf780ae9199ea5613ff4db50751452762a6b', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 2395, hash: '7f073fdf4f073323bc45f66b7c84064bd3a628fc2b11308177adc9c5a33a38a7', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 1023, hash: '5d65deb6e6bf43fd78aa8fbf16c17bbf802289a5fc8313ee22dc0a87c2d3e83a', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'barcode/index.html': {size: 4137, hash: '824b5822334a131acc4ed7d4460bfbe894ab93fe52ac70fb008fdc399ad1ac92', text: () => import('./assets-chunks/barcode_index_html.mjs').then(m => m.default)},
    'styles-5INURTSO.css': {size: 0, hash: 'menYUTfbRu8', text: () => import('./assets-chunks/styles-5INURTSO_css.mjs').then(m => m.default)}
  },
};

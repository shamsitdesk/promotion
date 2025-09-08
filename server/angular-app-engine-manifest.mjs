
export default {
  basePath: 'https://shamsitdesk.github.io/promo',
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};

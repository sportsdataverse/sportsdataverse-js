// Public parser entry — the `sportsdataverse/parsers` subpath export. Turns a raw
// ESPN / native payload into tidy rows without the package root's HTTP layer.
// Everything in ./browser.js (the browser-safe barrel the docs playground
// bundles) plus the node-only KenPom HTML parser (cheerio); importing this
// module also registers parse_kenpom_page in PARSERS.

export * from "./browser.js";
export { parse_kenpom_page } from "./kenpom.js";

// decode-html ships no types: it exports one function that decodes the XML entities and &nbsp;.
declare module "decode-html" {
  function decodeHTMLEntities(text: string): string;
  export = decodeHTMLEntities;
}

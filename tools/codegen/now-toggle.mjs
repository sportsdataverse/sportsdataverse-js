// Port of sdv-py tools/codegen/generate.py (pin 719de79) now_variant toggle:
// explicit now_toggle, else the first optional path param with no default,
// else the last path param. Returns undefined when there are no path params.
export function nowToggle(ep) {
  if (ep.now_toggle) return ep.now_toggle;
  const pp = ep.path_params ?? [];
  const noneDefault = pp.find((p) => p.required === false && p.default === undefined);
  return (noneDefault ?? pp[pp.length - 1])?.name;
}

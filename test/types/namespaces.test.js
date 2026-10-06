import should from 'should';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import sdv from '../../dist/index.js';

// The typed default export (src/index.ts `Sdv`, src/generated/namespaces.ts) against
// the runtime object, read through the BUILT declarations as a consumer's `tsc` reads
// them: the same namespaces, each with exactly the runtime's members. Plus the type
// tests in surface.check.ts (overloads, row types, ids, `unknown`, aliases).

const here = dirname(fileURLToPath(import.meta.url));
const OPTIONS = {
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  target: ts.ScriptTarget.ES2022,
  strict: true,
  noEmit: true,
  skipLibCheck: false,
  types: [],
};

describe('typed default export (dist/index.d.ts)', function () {
  this.timeout(180000);
  let program;
  let ms;
  before(() => {
    const t0 = Date.now();
    program = ts.createProgram([join(here, 'surface.check.ts')], OPTIONS);
    ts.getPreEmitDiagnostics(program); // the full consumer check, timed
    ms = Date.now() - t0;
  });

  it('surface.check.ts compiles under strict (overloads, row types, ids, unknown, aliases), as a consumer', () => {
    const diags = ts.getPreEmitDiagnostics(program).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    diags.should.eql([]);
    console.log(`      consumer tsc (surface.check.ts against dist/*.d.ts): ${ms} ms`);
  });

  it('every namespace and every member: the type has exactly the runtime keys', () => {
    const checker = program.getTypeChecker();
    const file = program.getSourceFile(join(here, '..', '..', 'dist', 'index.d.ts'));
    should.exist(file);
    const def = checker.getExportsOfModule(checker.getSymbolAtLocation(file)).find((s) => s.escapedName === 'default');
    const type = checker.getTypeOfSymbolAtLocation(checker.getAliasedSymbol(def), file);
    const typed = Object.fromEntries(
      type.getProperties().map((ns) => [ns.name, checker.getTypeOfSymbolAtLocation(ns, file).getProperties().map((m) => m.name)])
    );
    Object.keys(typed).sort().should.eql(Object.keys(sdv).sort(), 'namespaces');
    let members = 0;
    for (const ns of Object.keys(sdv)) {
      const runtime = Object.keys(sdv[ns]).sort();
      const missing = runtime.filter((k) => !typed[ns].includes(k));
      const extra = typed[ns].filter((k) => !(k in sdv[ns]));
      missing.should.eql([], `sdv.${ns}: runtime members the type lacks`);
      extra.should.eql([], `sdv.${ns}: typed members the runtime lacks`);
      members += runtime.length;
    }
    members.should.be.above(10000);
  });
});

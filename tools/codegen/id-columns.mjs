// The runtime's id-column predicate for the codegen: src/core/id_columns.ts itself
// (dependency-free), transpiled in memory, so the generated row types classify
// ids with the SAME code the runtime converts them with, and codegen needs no
// build first. test/int64.test.js asserts both classify every schema column alike.
import { readFileSync } from "node:fs";
import ts from "typescript";

export const ID_COLUMNS_SOURCE = new URL("../../src/core/id_columns.ts", import.meta.url);

const js = ts.transpileModule(readFileSync(ID_COLUMNS_SOURCE, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

/** @type {{ isIdColumn: (name: string) => boolean, MLBAM_ID_COLUMNS: readonly string[] }} */
const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

export const { isIdColumn, MLBAM_ID_COLUMNS } = mod;

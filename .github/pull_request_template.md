<!-- Thanks for contributing to sportsdataverse-js! -->

## Summary

<!-- What does this PR do, and why? -->

## Type of change

- [ ] `feat` — new endpoint / family / feature
- [ ] `fix` — bug fix
- [ ] `docs` — documentation / guides / playground
- [ ] `refactor` / `chore` / `test` / `ci`
- [ ] Breaking change

## How was this tested?

- [ ] `npm test` passes
- [ ] `npm run codegen:check` is green (no drift)
- [ ] `npm run build` / `npm run typecheck` pass
- [ ] `cd docs && npx docusaurus build` passes (if docs/playground changed)

## Checklist

- [ ] Conventional Commit title (e.g. `feat(odds): …`, `fix(cfb): …`)
- [ ] If I changed any `tools/codegen/endpoints/*.yaml`, I ran `npm run codegen`
      and committed the regenerated output (I did **not** hand-edit
      `src/generated/**` or `docs/docs/reference/**`)
- [ ] If I changed `src/parsers/**`, I re-ran `npm run bundle:parsers`
- [ ] New code is typed and passes lint/typecheck
- [ ] No AI/assistant co-author trailers or "Generated with …" lines on my commits

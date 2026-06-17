---
name: Bug report
about: Report a wrapper that errors, returns wrong data, or a broken endpoint
title: "[bug] "
labels: bug
assignees: ''
---

**Describe the bug**
A clear description of what's wrong.

**Which package surface?**
- League / namespace + method (e.g. `sdv.cfb.espnCfbScoreboard`, `sdv.odds.oddsApiSports`):
- Raw or `{ parsed: true }`:

**Reproduction**

```js
import sdv from 'sportsdataverse';
const data = await sdv.<league>.<method>({ /* params */ });
```

**Expected vs. actual**
What you expected, and what happened (paste the error or a snippet of the wrong output).

**Environment**
- `sportsdataverse` version:
- Node.js version (`node -v`, must be ≥ 20.18.1):
- OS:

**Additional context**
Anything else (the endpoint may have changed upstream at ESPN / the provider, etc.).

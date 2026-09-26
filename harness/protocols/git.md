## Git

**One declared task, one commit.** If a change needs two sentences with a "and
also" in the middle, it is two commits.

**Message format** — `<type>(<scope>): <emoji> <subject>`, scope optional,
subject in the imperative present tense, no trailing period:

```text
feat(tools): ✨ add the xml formatter
fix(base64-text): 🐛 decode URL-safe input without padding
```

| Type | Emoji | For |
|---|---|---|
| `feat` | ✨ | a new capability a person can use |
| `fix` | 🐛 | a defect a person could hit |
| `docs` | 📝 | documentation and READMEs |
| `style` | 🎨 | formatting only, no behaviour change |
| `refactor` | ♻️ | restructuring that neither fixes nor adds |
| `test` | 🧪 | tests |
| `chore` | 🔧 | build config, dependencies, maintenance |
| `release` | 🔖 | version bumps and release preparation |

`bin/harness install-hooks` installs two hooks: `pre-commit` runs the cheap
half of the ladder (`verify/quick.sh`), and `commit-msg` rejects anything
else, so the convention holds whether a person or an agent is typing.

**Never add an AI co-author.** No `Co-Authored-By` trailer for any assistant, no
"generated with" footer, no changed committer. Every commit is authored by the
local git user and nobody else. If your harness adds such a trailer by default,
strip it before committing.

**Commit only what you were asked to commit.** Never `git add -A` over a dirty
tree you did not create, never commit generated files that `verify/harness.sh`
would reject, and never push, tag or open a PR unless you were asked to.

**Never rewrite shared history.** No force push (`--force-with-lease` only, and
only after saying why), no deleting a `v*` tag. What reaches the production
branch is deployed by Cloudflare Pages on its own; a rewritten branch means the
live site was built from a commit that no longer exists.

**Scopes** are the area the commit touches: a tool id (`base64-text`), `tools`
for several, `shell`, `i18n`, `design`, `harness`, `verify`, `ci`, `deps`.

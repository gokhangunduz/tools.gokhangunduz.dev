# harness/

The source every agent tool's configuration is generated from. Adapted from the
[harnesswift](https://github.com/gokhangunduz/harnesswift) template for this
web project: the Swift, Xcode and App Store parts are gone, and the ladder
under `verify/` checks a Next.js static export instead.

`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.claude/agents|skills|commands/`,
`.claude/settings.json`, `.cursor/rules/`, `.github/copilot-instructions.md` and
`.github/ISSUE_TEMPLATE/` are **all generated from this folder**. Editing one of
them is editing a build artefact: the next `bin/harness sync` overwrites it, and
`verify/harness.sh` fails in the meantime.

```
contract.md          the working contract — becomes AGENTS.md and every pointer
manifest.json        project facts, the roles, which targets are generated
roles/<name>.md      one specialist's operating brief
skills/<name>/       one specialist's knowledge; SKILL.md plus references/
commands/<name>.md   a slash command
protocols/           procedures needed some of the time: git, orchestration, reporting
github/              the canonical labels and the issue templates
```

## Changing something

```sh
$EDITOR harness/contract.md      # or a role, a skill, the manifest
bin/harness sync                 # regenerate every target
zsh verify/harness.sh            # or just wait for CI to say the same thing
```

Commit the source and the generated files together. A commit that changes one
without the other leaves the repository describing two different contracts.

## The Next.js block

`next dev` writes a managed block (`<!-- BEGIN:nextjs-agent-rules -->`) into
`AGENTS.md` when it is missing or out of date. `bin/harness sync` emits that
block itself, taken from the installed `next` package
(`node_modules/next/dist/server/lib/generate-agent-files.js`), so `next dev`
finds it current and leaves the file alone. After a Next.js upgrade that
changes the block, `verify/harness.sh` reports `AGENTS.md` as stale — run
`bin/harness sync` and commit.

## Why generated rather than shared

Every tool wants the instructions in its own place and its own format, and the
list of tools changes yearly. Writing the contract once and projecting it means
adding a tool costs one function in `bin/harness`, and it means no agent is
working from an older copy of the rules than another.

`contract.md` is deliberately vendor-neutral: it never names an agent tool, a
model or a model vendor. Anything tool-specific belongs in `manifest.json` under
that target.

## Adding a specialist

1. `harness/roles/<name>.md` — the brief.
2. `harness/skills/<name>/SKILL.md` — the knowledge, with frontmatter carrying
   `name` and `description` (a role may point at an existing skill instead, as
   `tool-author` points at `add-tool`).
3. An entry in `manifest.json` under `roles`, including the globs the role owns.
4. `bin/harness sync`.

### A skill without a role

`localization`, `networking` and `security` are knowledge the writers load when
the work calls for it, with no agent of their own. To add one, create
`harness/skills/<name>/SKILL.md` with `name`/`description` frontmatter and stop —
skills are discovered from the folder, so `bin/harness sync` picks it up without
a manifest entry. Point the owning role's brief at it so it is not forgotten.

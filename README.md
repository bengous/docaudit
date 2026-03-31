# DocAudit

A web app that audits documents using Claude and generates improved versions as PDF.

I built this for a specific use case: auditing technical responses to public procurement tenders in France. A company submits a PDF, Claude checks it against 8 criteria (is the timeline addressed? are safety measures concrete? is the document too generic?), then rewrites it with the gaps filled in. The output is a formatted PDF.

The domain is niche, but the pattern isn't. Swap the criteria and the PDF template and you've got a document auditor for grant applications, compliance checks, RFP responses, or anything where documents need to hit specific marks.

## How it works

Three steps:

1. **Upload** — Drop a PDF. Text gets extracted with `unpdf`.
2. **Audit** — Claude evaluates the document against the criteria and returns structured JSON: a status, explanation, and suggestion for each one.
3. **Rewrite** — Claude rewrites the document, addressing every flagged issue. The result is compiled to PDF via Typst.

The second call uses `--resume <sessionId>` to continue the same Claude conversation — Claude already has the full audit in context, so there's no need to re-send anything.

### Claude CLI integration

The app shells out to `claude -p` (pipe mode) via `node:child_process.spawn`. No API key in the code — it uses whatever auth the CLI already has.

Notable flags:
- `--output-format json --json-schema <schema>` — structured output. Claude calls a `StructuredOutput` tool internally, and the parser in `spawn.ts` extracts it from the response envelope.
- `--tools "" --strict-mcp-config --mcp-config '{"mcpServers":{}}'` — disables all tools and MCP servers. Not needed for text analysis, and it avoids surprises.

### PDF generation

The rewritten document is compiled with [Typst](https://typst.app/). The template reads structured JSON via `sys.inputs.payload`. Compilation happens in memory — template in via stdin, PDF out via stdout, no temp files.

### Mock mode

The app runs in mock mode by default: hardcoded fixtures with artificial delay. You can work on the UI, poke at the flow, and demo it without the Claude CLI or burning tokens. Toggle mock/live in the header.

## Quick start

```bash
bun install
bun run dev
```

Open http://localhost:5173. Click "Load demo" to pre-fill with a sample document.

For live mode (requires [Claude CLI](https://docs.anthropic.com/en/docs/claude-code) authenticated):

```bash
MOCK_MODE=false bun run dev
```

You'll also need [Typst](https://typst.app/) on PATH — even in mock mode, it's used for PDF generation.

## Adapting this to another domain

The whole app is a single SvelteKit project with no external services beyond the Claude CLI. To make it yours:

**The audit criteria** live in `src/lib/fixtures/heuristics.ts` — it's a plain text prompt. Each criterion has an ID, a description, and what OK / needs work / missing looks like. This is the main thing to rewrite.

**The prompts** are in `src/lib/claude/prompts.ts`. The audit prompt wraps the criteria and tells Claude to return structured JSON. The draft prompt tells Claude how to rewrite. The JSON schemas in the same file define the output shape — change them if your data structure differs.

**The PDF template** is `src/lib/typst/reponse-technique.typ` ([Typst docs](https://typst.app/docs/)). It reads JSON from `sys.inputs.payload`. Change the layout to match whatever you're generating.

**Types** (`src/lib/types.ts`) and **fixtures** (`src/lib/fixtures/`) need updating if you change the data structure, so mock mode keeps working.

## Project structure

```
src/
  lib/
    types.ts                  # shared TypeScript types
    fixtures/                 # demo data and mock responses
    claude/
      spawn.ts                # Claude CLI runner + JSON output parser
      analyze.ts              # audit call (structured output)
      draft.ts                # rewrite call (resumes session)
      mock.ts                 # mock layer (returns fixtures)
      prompts.ts              # system prompts + JSON schemas
    typst/
      compile.ts              # Typst PDF compilation (stdin -> stdout)
      reponse-technique.typ   # PDF template
    audit/
      workflow.ts             # UI workflow logic (file validation, API calls)
      ui.ts                   # status display config
    components/               # Svelte 5 components
  routes/
    +page.svelte              # main UI (3-step state machine)
    api/analyze/              # POST -> JSON audit results
    api/generate-draft/       # POST -> PDF binary
```

## Stack

SvelteKit + Svelte 5 (runes), Tailwind CSS v4, Claude CLI in pipe mode, Typst for PDF, unpdf for text extraction.

## License

MIT

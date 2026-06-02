# DocAudit

A web app that audits documents using a configurable LLM harness and generates improved versions as PDF.

I built this for a specific use case: auditing technical responses to public procurement tenders in France. A company submits a PDF, the selected LLM harness checks it against 8 criteria (is the timeline addressed? are safety measures concrete? is the document too generic?), then rewrites it with the gaps filled in. The output is a formatted PDF.

The domain is niche, but the pattern isn't. Swap the criteria and the PDF template and you've got a document auditor for grant applications, compliance checks, RFP responses, or anything where documents need to hit specific marks.

## How it works

Three steps:

1. **Upload** — Drop a PDF. Text gets extracted with `unpdf`.
2. **Audit** — the configured harness evaluates the document against the criteria and returns structured JSON: a status, explanation, and suggestion for each one.
3. **Rewrite** — the configured harness rewrites the document, addressing every flagged issue. The result is compiled to PDF via Typst.

Claude draft generation uses `--resume <sessionId>` to continue the same CLI conversation. Codex does not share that Claude session contract, so its draft path uses the documented fallback: the app resends the original document text plus the structured audit result.

### LLM harness integration

The live harness catalog is declared through `src/lib/server/llm/config.ts`. It declares each harness, model catalog, default model, command adapter, output parser, and draft continuity capability.

Supported live harnesses:

- `claude` — shells out to `claude -p`; keeps the static `sonnet` / `haiku` catalog; supports structured output via `--json-schema`; supports draft continuity with `--resume`.
- `codex` — loads model metadata dynamically from `codex debug models`, filtering to models where `visibility == "list"`; supports structured output via `--output-schema` and `--output-last-message`; draft generation resends document and audit context instead of resuming a Claude-style session.

Codex model metadata is cached for a short period and falls back to a static catalog if `codex debug models` is unavailable, slow, or returns invalid JSON. Each Codex model carries its own default reasoning effort and supported reasoning efforts.

Claude flags:
- `--output-format json --json-schema <schema>` — structured output. Claude calls a `StructuredOutput` tool internally, and the generic parser extracts it from the response envelope.
- `--tools "" --strict-mcp-config --mcp-config '{"mcpServers":{}}'` — disables all tools and MCP servers. Not needed for text analysis, and it avoids surprises.

Codex flags:
- `codex exec --output-schema <schema-file> --output-last-message <file>` — structured final output is read from the last-message file.
- `--config model_reasoning_effort="<level>"` — sent only for Codex selections after validating the level against the selected model metadata.
- `--sandbox read-only --ephemeral --ignore-rules` — keeps this path focused on text generation and avoids persisted Codex sessions.

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

For live Claude mode (requires Claude CLI authenticated):

```bash
MOCK_MODE=false LLM_HARNESS=claude LLM_MODEL=sonnet bun run dev
```

For live Codex mode (requires Codex CLI authenticated):

```bash
MOCK_MODE=false LLM_HARNESS=codex LLM_MODEL=gpt-5.4 LLM_REASONING_EFFORT=low bun run dev
```

If `LLM_REASONING_EFFORT` is omitted, the app uses the selected Codex model's `default_reasoning_level` from `codex debug models`.

You'll also need [Typst](https://typst.app/) on PATH — even in mock mode, it's used for PDF generation.

## Adapting this to another domain

The whole app is a single SvelteKit project with no external services beyond the selected CLI harness. To make it yours:

**The audit criteria** live in `src/lib/fixtures/heuristics.ts` — it's a plain text prompt. Each criterion has an ID, a description, and what OK / needs work / missing looks like. This is the main thing to rewrite.

**The prompts** are in `src/lib/server/llm/prompts.ts`. The audit prompt wraps the criteria and tells the selected harness to return structured JSON. The draft prompt tells the selected harness how to rewrite. The JSON schemas in the same file define the output shape — change them if your data structure differs.

**The PDF template** is `src/lib/typst/reponse-technique.typ` ([Typst docs](https://typst.app/docs/)). It reads JSON from `sys.inputs.payload`. Change the layout to match whatever you're generating.

**Types** (`src/lib/types.ts`) and **fixtures** (`src/lib/fixtures/`) need updating if you change the data structure, so mock mode keeps working.

## Project structure

```
src/
  lib/
    types.ts                  # shared TypeScript types
    llm/
      types.ts                # serializable harness/model selection types
    fixtures/                 # demo data and mock responses
    server/
      llm/
        config.ts             # live harness catalog and env/request resolution
        codex-catalog.ts      # dynamic Codex model catalog loader + fallback
        audit.ts              # generic audit/draft generation interface
        runner.ts             # child_process command runner
        parsers.ts            # structured JSON output parsers
        prompts.ts            # system prompts + JSON schemas
        adapters/             # Claude and Codex command adapters
    audit/
      mock.ts                 # mock layer (returns fixtures)
      workflow.ts             # UI workflow logic (file validation, API calls)
      ui.ts                   # status display config
    typst/
      compile.ts              # Typst PDF compilation (stdin -> stdout)
      reponse-technique.typ   # PDF template
    components/               # Svelte 5 components
  routes/
    +page.svelte              # main UI (3-step state machine)
    api/analyze/              # POST -> JSON audit results
    api/generate-draft/       # POST -> PDF binary
```

## Stack

SvelteKit + Svelte 5 (runes), Tailwind CSS v4, Claude/Codex CLI harnesses, Typst for PDF, unpdf for text extraction.

## License

MIT

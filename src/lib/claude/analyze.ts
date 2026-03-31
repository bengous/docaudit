import type { AnalysisResponse } from '$lib/types';
import { analysisJsonSchema, auditSystemPrompt } from './prompts';
import { parseClaudeJsonOutput, runClaude } from './spawn';

const ANALYZE_TIMEOUT_MS = 120_000;

export async function auditDocument(
	documentText: string,
	model: 'sonnet' | 'haiku' = 'sonnet',
): Promise<AnalysisResponse & { sessionId: string }> {
	const userMessage = `${auditSystemPrompt}

---

DOCUMENT TO AUDIT:
${documentText}`;

	console.log(`[analyze] prompt length: ${userMessage.length} chars`);

	const raw = await runClaude(
		[
			'-p',
			'--model',
			model,
			'--output-format',
			'json',
			'--json-schema',
			JSON.stringify(analysisJsonSchema),
			'--tools',
			'',
			'--permission-mode',
			'bypassPermissions',
			'--strict-mcp-config',
			'--mcp-config',
			'{"mcpServers":{}}',
			'--disable-slash-commands',
		],
		userMessage,
		{ timeoutMs: ANALYZE_TIMEOUT_MS },
	);

	console.log(`[analyze] raw output: ${raw.length} bytes`);
	const { content, sessionId } = parseClaudeJsonOutput(raw);
	console.log(`[analyze] parsed, sessionId=${sessionId}, content length=${content.length}`);
	const analysis = JSON.parse(content) as AnalysisResponse;
	return { ...analysis, sessionId };
}

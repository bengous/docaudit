import type { DraftData } from '$lib/types';
import { draftJsonSchema, draftSystemPrompt } from './prompts';
import { parseClaudeJsonOutput, runClaude } from './spawn';

const DRAFT_TIMEOUT_MS = 120_000;

export async function generateDraft(
	document: string,
	sessionId?: string,
	model: 'sonnet' | 'haiku' = 'sonnet',
): Promise<DraftData> {
	const args: string[] = [
		'-p',
		'--model',
		model,
		'--output-format',
		'json',
		'--json-schema',
		JSON.stringify(draftJsonSchema),
		'--tools',
		'',
		'--permission-mode',
		'bypassPermissions',
		'--strict-mcp-config',
		'--mcp-config',
		'{"mcpServers":{}}',
		'--disable-slash-commands',
	];

	let userMessage: string;

	if (sessionId) {
		args.push('--resume', sessionId);
		userMessage = `Now, rewrite the document by addressing all the points raised in your audit. Fill in the structured fields: entreprise (nom, adresse, email, contact), marche (titre, sous-titre of the location, date, reference), and sections (titre + contenu for each improved section). Be concrete and specific.`;
	} else {
		userMessage = `${draftSystemPrompt}\n\n---\n\nDOCUMENT TO IMPROVE:\n${document}`;
	}

	const raw = await runClaude(args, userMessage, { timeoutMs: DRAFT_TIMEOUT_MS });
	const { content } = parseClaudeJsonOutput(raw);
	return JSON.parse(content) as DraftData;
}

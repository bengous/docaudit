import type { StructuredOutput } from './types';

export function extractJson(text: string): string | null {
	const trimmed = text.trim();
	if (trimmed.startsWith('{')) return trimmed;
	const fenceMatch = trimmed.match(/```(?:json)?\s*\n?\s*(\{[\s\S]*\})\s*\n?\s*```/);
	if (fenceMatch) return fenceMatch[1];
	return null;
}

export function parsePlainJsonOutput(raw: string): StructuredOutput {
	const json = extractJson(raw);
	if (!json) {
		throw new Error('LLM output did not contain a JSON object.');
	}
	return { content: json };
}

export function parseClaudeJsonOutput(raw: string): StructuredOutput {
	const messages = JSON.parse(raw) as Array<Record<string, unknown>>;

	let continuityId = '';
	for (const msg of messages) {
		if (msg.type === 'result' && typeof msg.session_id === 'string') {
			continuityId = msg.session_id;
		}
	}

	for (const msg of messages) {
		if (msg.type !== 'assistant') continue;
		const message = msg.message as { content?: Array<Record<string, unknown>> } | undefined;
		if (!message?.content) continue;
		for (const block of message.content) {
			if (block.type === 'tool_use' && block.name === 'StructuredOutput') {
				return { content: JSON.stringify(block.input), continuityId };
			}
		}
	}

	for (const msg of messages) {
		if (msg.type === 'result' && typeof msg.result === 'string' && msg.result) {
			const json = extractJson(msg.result);
			return { content: json ?? msg.result, continuityId };
		}
	}

	let text = '';
	for (const msg of messages) {
		if (msg.type !== 'assistant') continue;
		const message = msg.message as { content?: Array<Record<string, unknown>> } | undefined;
		if (!message?.content) continue;
		for (const block of message.content) {
			if (block.type === 'text' && typeof block.text === 'string') {
				text += block.text;
			}
		}
	}

	const json = extractJson(text);
	return { content: json ?? text, continuityId };
}

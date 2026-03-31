import { spawn } from 'node:child_process';

const DEFAULT_TIMEOUT_MS = 60_000;

export interface RunClaudeOptions {
	timeoutMs?: number;
}

export function runClaude(
	args: string[],
	stdin: string,
	options: RunClaudeOptions = {},
): Promise<string> {
	return new Promise((resolve, reject) => {
		const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
		const t0 = Date.now();
		const ts = () => `+${((Date.now() - t0) / 1000).toFixed(1)}s`;

		console.log(`[claude ${ts()}] spawning: claude ${args.join(' ')}`);
		console.log(`[claude ${ts()}] stdin length: ${stdin.length} chars`);

		const proc = spawn('claude', args, { stdio: ['pipe', 'pipe', 'pipe'] });
		const startedAt = Date.now();

		console.log(`[claude ${ts()}] process spawned (pid: ${proc.pid})`);

		let stdout = '';
		let stderr = '';
		let settled = false;
		let firstStdout = true;
		let firstStderr = true;

		const timeout = setTimeout(() => {
			if (settled) return;
			settled = true;
			console.log(`[claude ${ts()}] TIMEOUT after ${timeoutMs}ms — killing process`);
			proc.kill('SIGTERM');
			reject(
				new Error(
					`Claude CLI timed out after ${timeoutMs}ms (args: ${args.join(' ')}). stderr: ${stderr.trim()}`,
				),
			);
		}, timeoutMs);

		proc.stdout.on('data', (data: Buffer) => {
			if (firstStdout) {
				console.log(`[claude ${ts()}] first stdout chunk (${data.length} bytes)`);
				firstStdout = false;
			}
			stdout += data.toString();
		});
		proc.stderr.on('data', (data: Buffer) => {
			const chunk = data.toString();
			if (firstStderr) {
				console.log(`[claude ${ts()}] first stderr: ${chunk.trim().slice(0, 200)}`);
				firstStderr = false;
			}
			stderr += chunk;
		});

		proc.on('close', (code) => {
			if (settled) {
				clearTimeout(timeout);
				return;
			}
			settled = true;
			clearTimeout(timeout);
			const durationMs = Date.now() - startedAt;

			console.log(
				`[claude ${ts()}] exited code=${code}, stdout=${stdout.length} bytes, stderr=${stderr.length} bytes, duration=${durationMs}ms`,
			);

			if (code !== 0) {
				console.log(`[claude ${ts()}] stderr: ${stderr.trim().slice(0, 500)}`);
				reject(
					new Error(
						`Claude CLI exited with code ${code} after ${durationMs}ms (args: ${args.join(' ')}). stderr: ${stderr.trim()}`,
					),
				);
			} else {
				resolve(stdout);
			}
		});

		proc.on('error', (err) => {
			settled = true;
			clearTimeout(timeout);
			console.log(`[claude ${ts()}] spawn error: ${err.message}`);
			reject(new Error(`Failed to spawn claude: ${err.message}`));
		});

		proc.stdin.write(stdin);
		proc.stdin.end();
	});
}

export interface ClaudeJsonResult {
	content: string;
	sessionId: string;
}

/**
 * Extract a JSON object from text that may contain markdown fences or surrounding prose.
 */
function extractJson(text: string): string | null {
	const trimmed = text.trim();
	if (trimmed.startsWith('{')) return trimmed;
	const fenceMatch = trimmed.match(/```(?:json)?\s*\n?\s*(\{[\s\S]*\})\s*\n?\s*```/);
	if (fenceMatch) return fenceMatch[1];
	return null;
}

/**
 * Parse the JSON envelope from `claude -p --output-format json`.
 * Extracts the result text and session_id. The result text is expected
 * to be a JSON string (prompt-based structured output).
 */
export function parseClaudeJsonOutput(raw: string): ClaudeJsonResult {
	const messages = JSON.parse(raw) as Array<Record<string, unknown>>;

	// Extract session_id from the result message
	let sessionId = '';
	for (const msg of messages) {
		if (msg.type === 'result' && typeof msg.session_id === 'string') {
			sessionId = msg.session_id;
		}
	}

	// When --json-schema is used, Claude calls StructuredOutput tool
	for (const msg of messages) {
		if (msg.type !== 'assistant') continue;
		const message = msg.message as { content?: Array<Record<string, unknown>> } | undefined;
		if (!message?.content) continue;
		for (const block of message.content) {
			if (block.type === 'tool_use' && block.name === 'StructuredOutput') {
				return { content: JSON.stringify(block.input), sessionId };
			}
		}
	}

	// Fallback: extract from the result field (prompt-based JSON)
	for (const msg of messages) {
		if (msg.type === 'result' && typeof msg.result === 'string' && msg.result) {
			const json = extractJson(msg.result);
			if (json) return { content: json, sessionId };
			return { content: msg.result, sessionId };
		}
	}

	// Fallback: concatenate all assistant text blocks
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
	if (json) return { content: json, sessionId };
	return { content: text, sessionId };
}

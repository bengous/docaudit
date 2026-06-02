import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parsePlainJsonOutput } from '../parsers';
import type { CommandResult, PreparedCommand } from '../runner';
import type { HarnessAdapter, HarnessInvocation, StructuredOutput } from '../types';

export const codexAdapter: HarnessAdapter = {
	async prepareCommand(input: HarnessInvocation): Promise<PreparedCommand> {
		const dir = await mkdtemp(join(tmpdir(), 'docaudit-codex-'));
		const schemaPath = join(dir, 'schema.json');
		const lastMessagePath = join(dir, 'last-message.txt');

		await writeFile(schemaPath, JSON.stringify(input.schema), 'utf8');

		const args = ['--ask-for-approval', 'never'];
		if (input.reasoningEffort) {
			args.push('--config', `model_reasoning_effort="${input.reasoningEffort}"`);
		}
		args.push(
			'exec',
			'--model',
			input.model,
			'--sandbox',
			'read-only',
			'--ephemeral',
			'--ignore-rules',
			'--output-schema',
			schemaPath,
			'--output-last-message',
			lastMessagePath,
			'-',
		);

		return {
			label: 'codex',
			command: 'codex',
			args,
			stdin: input.prompt,
			timeoutMs: input.timeoutMs,
			outputFiles: { lastMessage: lastMessagePath },
			cleanupPaths: [dir],
		};
	},

	async parseOutput(result: CommandResult, command: PreparedCommand): Promise<StructuredOutput> {
		const outputPath = command.outputFiles?.lastMessage;
		if (!outputPath) return parsePlainJsonOutput(result.stdout);

		try {
			const lastMessage = await readFile(outputPath, 'utf8');
			return parsePlainJsonOutput(lastMessage || result.stdout);
		} catch {
			return parsePlainJsonOutput(result.stdout);
		}
	},
};

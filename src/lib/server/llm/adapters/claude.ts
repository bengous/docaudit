import { parseClaudeJsonOutput } from '../parsers';
import type { CommandResult, PreparedCommand } from '../runner';
import type { HarnessAdapter, HarnessInvocation, StructuredOutput } from '../types';

export const claudeAdapter: HarnessAdapter = {
	async prepareCommand(input: HarnessInvocation): Promise<PreparedCommand> {
		const args = [
			'-p',
			'--model',
			input.model,
			'--output-format',
			'json',
			'--json-schema',
			JSON.stringify(input.schema),
			'--tools',
			'',
			'--permission-mode',
			'bypassPermissions',
			'--strict-mcp-config',
			'--mcp-config',
			'{"mcpServers":{}}',
			'--disable-slash-commands',
		];

		if (input.useResume && input.continuityId) {
			args.push('--resume', input.continuityId);
		}

		return {
			label: 'claude',
			command: 'claude',
			args,
			stdin: input.prompt,
			timeoutMs: input.timeoutMs,
		};
	},

	async parseOutput(result: CommandResult): Promise<StructuredOutput> {
		return parseClaudeJsonOutput(result.stdout);
	},
};

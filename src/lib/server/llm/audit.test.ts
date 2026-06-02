import { readFile, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'bun:test';
import { mockAnalysis } from '../../fixtures/mock-analysis';
import { mockDraftData } from '../../fixtures/mock-draft-data';
import { auditDocument, generateDraft } from './audit';
import type { CommandRunner, PreparedCommand } from './runner';

describe('LLM audit runner', () => {
	it('runs Claude analysis through the declarative harness adapter', async () => {
		const commands: PreparedCommand[] = [];
		const runner: CommandRunner = async (command) => {
			commands.push(command);
			return {
				stdout: JSON.stringify([
					{
						type: 'assistant',
						message: {
							content: [{ type: 'tool_use', name: 'StructuredOutput', input: mockAnalysis }],
						},
					},
					{ type: 'result', session_id: 'sess_123' },
				]),
				stderr: '',
				durationMs: 1,
			};
		};

		const result = await auditDocument({
			documentText: 'technical response',
			selection: { harness: 'claude', model: 'sonnet' },
			runner,
		});

		expect(result.continuityId).toBe('sess_123');
		expect(result.summary.score).toBe(mockAnalysis.summary.score);
		expect(commands[0].command).toBe('claude');
		expect(commands[0].args).toContain('--json-schema');
		expect(commands[0].args).toContain('sonnet');
	});

	it('resumes Claude draft generation when continuity is available', async () => {
		const commands: PreparedCommand[] = [];
		const runner: CommandRunner = async (command) => {
			commands.push(command);
			return {
				stdout: JSON.stringify([
					{
						type: 'assistant',
						message: {
							content: [{ type: 'tool_use', name: 'StructuredOutput', input: mockDraftData }],
						},
					},
					{ type: 'result', session_id: 'sess_123' },
				]),
				stderr: '',
				durationMs: 1,
			};
		};

		const result = await generateDraft({
			selection: { harness: 'claude', model: 'haiku' },
			continuityId: 'sess_123',
			runner,
		});

		expect(result.sections.length).toBe(mockDraftData.sections.length);
		expect(commands[0].args).toContain('--resume');
		expect(commands[0].args).toContain('sess_123');
		expect(commands[0].stdin).not.toContain('AUDIT RESULT');
	});

	it('runs Codex draft generation by resending document and audit context', async () => {
		const commands: PreparedCommand[] = [];
		let schema: Record<string, unknown> | undefined;
		const runner: CommandRunner = async (command) => {
			commands.push(command);
			const schemaPath = command.args[command.args.indexOf('--output-schema') + 1];
			schema = JSON.parse(await readFile(schemaPath, 'utf8')) as Record<string, unknown>;
			if (command.outputFiles?.lastMessage) {
				await writeFile(command.outputFiles.lastMessage, JSON.stringify(mockDraftData), 'utf8');
			}
			return { stdout: '', stderr: '', durationMs: 1 };
		};

		const result = await generateDraft({
			selection: { harness: 'codex', model: 'gpt-5.4', reasoningEffort: 'low' },
			documentText: 'technical response',
			analysis: mockAnalysis,
			runner,
		});

		expect(result.entreprise.nom).toBe(mockDraftData.entreprise.nom);
		expect(commands[0].command).toBe('codex');
		expect(commands[0].args).toContain('exec');
		expect(commands[0].args).toContain('--config');
		expect(commands[0].args).toContain('model_reasoning_effort="low"');
		expect(commands[0].args).toContain('gpt-5.4');
		expect(commands[0].args).toContain('--output-schema');
		expect(commands[0].args).toContain('--output-last-message');
		expect(schema?.additionalProperties).toBe(false);
		expect(
			(schema?.properties as Record<string, Record<string, unknown>>).entreprise
				.additionalProperties,
		).toBe(false);
		expect(commands[0].stdin).toContain('DOCUMENT TO IMPROVE');
		expect(commands[0].stdin).toContain('AUDIT RESULT');
	});

	it('fails clearly when a non-resumable harness has no fallback context', async () => {
		expect(
			generateDraft({
				selection: { harness: 'codex', model: 'gpt-5.5' },
				continuityId: 'codex-session',
			}),
		).rejects.toThrow('requires the original document and audit result');
	});
});

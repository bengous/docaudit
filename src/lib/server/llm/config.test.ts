import { describe, expect, it } from 'bun:test';
import { getClientLlmCatalog, LlmConfigError, resolveLlmSelection } from './config';

describe('LLM harness config', () => {
	it('exposes static Claude and resolved Codex harnesses to the client catalog', async () => {
		const catalog = await getClientLlmCatalog();
		expect(catalog.defaultHarness).toBe('claude');
		expect(catalog.harnesses.map((harness) => harness.id)).toEqual(['claude', 'codex']);
		expect(catalog.harnesses.find((harness) => harness.id === 'claude')?.models).toEqual([
			{ id: 'sonnet', label: 'Sonnet' },
			{ id: 'haiku', label: 'Haiku' },
		]);
		expect(catalog.harnesses.find((harness) => harness.id === 'codex')?.models).toContainEqual({
			id: 'gpt-5.4',
			label: 'GPT-5.4',
			defaultReasoningEffort: 'medium',
			reasoningEfforts: ['low', 'medium', 'high', 'xhigh'],
		});
		expect(catalog.harnesses.find((harness) => harness.id === 'codex')?.reasoningEfforts).toEqual([
			'low',
			'medium',
			'high',
			'xhigh',
		]);
	});

	it('resolves request selection before environment defaults', async () => {
		expect(
			await resolveLlmSelection(
				{ harness: 'claude', model: 'haiku' },
				{ LLM_HARNESS: 'codex', LLM_MODEL: 'gpt-5.4' },
			),
		).toEqual({ harness: 'claude', model: 'haiku' });
	});

	it('uses environment defaults when the request does not select a harness', async () => {
		expect(
			await resolveLlmSelection(
				{},
				{ LLM_HARNESS: 'codex', LLM_MODEL: 'gpt-5.4', LLM_REASONING_EFFORT: 'low' },
			),
		).toEqual({
			harness: 'codex',
			model: 'gpt-5.4',
			reasoningEffort: 'low',
		});
	});

	it('accepts xhigh when the selected Codex model supports it', async () => {
		expect(
			await resolveLlmSelection({
				harness: 'codex',
				model: 'gpt-5.4',
				reasoningEffort: 'xhigh',
			}),
		).toEqual({
			harness: 'codex',
			model: 'gpt-5.4',
			reasoningEffort: 'xhigh',
		});
	});

	it('uses the Codex model default when no explicit reasoning effort is selected', async () => {
		expect(await resolveLlmSelection({ harness: 'codex', model: 'gpt-5.3-codex-spark' })).toEqual({
			harness: 'codex',
			model: 'gpt-5.3-codex-spark',
			reasoningEffort: 'high',
		});
	});

	it('rejects models outside the selected harness catalog', async () => {
		await expect(resolveLlmSelection({ harness: 'codex', model: 'sonnet' })).rejects.toThrow(
			LlmConfigError,
		);
	});

	it('rejects unknown reasoning efforts', async () => {
		await expect(
			resolveLlmSelection(
				{ harness: 'codex', model: 'gpt-5.4', reasoningEffort: 'max' as 'low' },
				{},
			),
		).rejects.toThrow(LlmConfigError);
	});
});

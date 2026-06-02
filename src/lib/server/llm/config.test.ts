import { describe, expect, it } from 'bun:test';
import { getClientLlmCatalog, LlmConfigError, resolveLlmSelection } from './config';

describe('LLM harness config', () => {
	it('exposes Claude and Codex harnesses to the client catalog', () => {
		const catalog = getClientLlmCatalog();
		expect(catalog.defaultHarness).toBe('claude');
		expect(catalog.harnesses.map((harness) => harness.id)).toEqual(['claude', 'codex']);
		expect(catalog.harnesses.find((harness) => harness.id === 'codex')?.models).toContainEqual({
			id: 'gpt-5.4',
			label: 'GPT-5.4',
		});
		expect(catalog.harnesses.find((harness) => harness.id === 'codex')?.reasoningEfforts).toEqual([
			'low',
			'medium',
			'high',
		]);
	});

	it('resolves request selection before environment defaults', () => {
		expect(
			resolveLlmSelection(
				{ harness: 'claude', model: 'haiku' },
				{ LLM_HARNESS: 'codex', LLM_MODEL: 'gpt-5.4' },
			),
		).toEqual({ harness: 'claude', model: 'haiku' });
	});

	it('uses environment defaults when the request does not select a harness', () => {
		expect(
			resolveLlmSelection(
				{},
				{ LLM_HARNESS: 'codex', LLM_MODEL: 'gpt-5.4', LLM_REASONING_EFFORT: 'low' },
			),
		).toEqual({
			harness: 'codex',
			model: 'gpt-5.4',
			reasoningEffort: 'low',
		});
	});

	it('rejects models outside the selected harness catalog', () => {
		expect(() => resolveLlmSelection({ harness: 'codex', model: 'sonnet' })).toThrow(
			LlmConfigError,
		);
	});

	it('rejects unknown reasoning efforts', () => {
		expect(() =>
			resolveLlmSelection(
				{ harness: 'codex', model: 'gpt-5.4', reasoningEffort: 'max' as 'low' },
				{},
			),
		).toThrow(LlmConfigError);
	});
});

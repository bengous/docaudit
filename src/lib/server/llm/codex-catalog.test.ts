import { describe, expect, it } from 'bun:test';
import {
	CODEX_FALLBACK_MODEL_CATALOG,
	clearCodexModelCatalogCache,
	getCodexModelCatalog,
	loadCodexModelCatalog,
	parseCodexDebugModelsOutput,
} from './codex-catalog';

const validCatalog = JSON.stringify({
	models: [
		{
			slug: 'hidden-model',
			display_name: 'Hidden Model',
			visibility: 'hidden',
			default_reasoning_level: 'medium',
			supported_reasoning_levels: [{ effort: 'low' }, { effort: 'medium' }],
		},
		{
			slug: 'gpt-5.4',
			display_name: 'GPT-5.4',
			visibility: 'list',
			default_reasoning_level: 'medium',
			supported_reasoning_levels: [
				{ effort: 'low' },
				{ effort: 'medium' },
				{ effort: 'high' },
				{ effort: 'xhigh' },
			],
		},
		{
			slug: 'gpt-5.3-codex-spark',
			display_name: 'GPT-5.3-Codex-Spark',
			visibility: 'list',
			default_reasoning_level: 'high',
			supported_reasoning_levels: [
				{ effort: 'low' },
				{ effort: 'medium' },
				{ effort: 'high' },
				{ effort: 'xhigh' },
			],
		},
	],
});

describe('Codex model catalog', () => {
	it('parses visible Codex models with model-specific reasoning metadata', () => {
		const catalog = parseCodexDebugModelsOutput(validCatalog);

		expect(catalog.source).toBe('debug-models');
		expect(catalog.defaultModel).toBe('gpt-5.4');
		expect(catalog.defaultReasoningEffort).toBe('medium');
		expect(catalog.models.map((model) => model.id)).toEqual(['gpt-5.4', 'gpt-5.3-codex-spark']);
		expect(catalog.models[0].reasoningEfforts).toEqual(['low', 'medium', 'high', 'xhigh']);
		expect(catalog.models[1].defaultReasoningEffort).toBe('high');
	});

	it('filters out hidden models', () => {
		const catalog = parseCodexDebugModelsOutput(validCatalog);
		expect(catalog.models.some((model) => model.id === 'hidden-model')).toBe(false);
	});

	it('falls back when the command returns invalid JSON', async () => {
		const catalog = await loadCodexModelCatalog(async () => 'not-json');
		expect(catalog).toBe(CODEX_FALLBACK_MODEL_CATALOG);
	});

	it('falls back when the command fails or is missing', async () => {
		const catalog = await loadCodexModelCatalog(async () => {
			throw new Error('spawn codex ENOENT');
		});
		expect(catalog.source).toBe('fallback');
		expect(catalog.models.length).toBeGreaterThan(0);
	});

	it('uses the cache instead of reloading the command output', async () => {
		clearCodexModelCatalogCache();
		let calls = 0;
		const runner = async () => {
			calls += 1;
			return validCatalog;
		};

		const cachedFirst = await getCodexModelCatalog({
			runner,
			now: () => 1,
			cacheTtlMs: 100,
			useCache: true,
		});
		const cachedSecond = await getCodexModelCatalog({
			runner,
			now: () => 50,
			cacheTtlMs: 100,
			useCache: true,
		});

		expect(cachedFirst.source).toBe('debug-models');
		expect(cachedSecond.models.map((model) => model.id)).toEqual(
			cachedFirst.models.map((model) => model.id),
		);
		expect(calls).toBe(1);
		clearCodexModelCatalogCache();
	});
});

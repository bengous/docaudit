import { spawn } from 'node:child_process';
import type { HarnessModelOption, ReasoningEffort } from '$lib/llm/types';

const CACHE_TTL_MS = 5 * 60 * 1000;
const COMMAND_TIMEOUT_MS = 5_000;
const CODEX_REASONING_EFFORTS = [
	'low',
	'medium',
	'high',
	'xhigh',
] as const satisfies readonly ReasoningEffort[];

export interface CodexModelCatalog {
	defaultModel: string;
	defaultReasoningEffort: ReasoningEffort;
	models: HarnessModelOption[];
	reasoningEfforts: readonly ReasoningEffort[];
	source: 'debug-models' | 'fallback';
}

export type CodexDebugModelsRunner = () => Promise<string>;

export interface GetCodexModelCatalogOptions {
	runner?: CodexDebugModelsRunner;
	now?: () => number;
	cacheTtlMs?: number;
	useCache?: boolean;
}

interface CachedCatalog {
	expiresAt: number;
	catalog: CodexModelCatalog;
}

let cachedCatalog: CachedCatalog | null = null;

export const CODEX_FALLBACK_MODEL_CATALOG: CodexModelCatalog = {
	defaultModel: 'gpt-5.5',
	defaultReasoningEffort: 'medium',
	reasoningEfforts: CODEX_REASONING_EFFORTS,
	source: 'fallback',
	models: [
		{
			id: 'gpt-5.5',
			label: 'GPT-5.5',
			defaultReasoningEffort: 'medium',
			reasoningEfforts: CODEX_REASONING_EFFORTS,
		},
		{
			id: 'gpt-5.4',
			label: 'GPT-5.4',
			defaultReasoningEffort: 'medium',
			reasoningEfforts: CODEX_REASONING_EFFORTS,
		},
		{
			id: 'gpt-5.4-mini',
			label: 'GPT-5.4-Mini',
			defaultReasoningEffort: 'medium',
			reasoningEfforts: CODEX_REASONING_EFFORTS,
		},
		{
			id: 'gpt-5.3-codex-spark',
			label: 'GPT-5.3-Codex-Spark',
			defaultReasoningEffort: 'high',
			reasoningEfforts: CODEX_REASONING_EFFORTS,
		},
	],
};

export async function getCodexModelCatalog(
	options: GetCodexModelCatalogOptions = {},
): Promise<CodexModelCatalog> {
	const now = options.now?.() ?? Date.now();
	const ttlMs = options.cacheTtlMs ?? CACHE_TTL_MS;
	const useCache = options.useCache ?? !options.runner;

	if (useCache && cachedCatalog && cachedCatalog.expiresAt > now) {
		return cachedCatalog.catalog;
	}

	const runner = options.runner ?? runCodexDebugModels;
	const catalog = await loadCodexModelCatalog(runner);

	if (useCache) {
		cachedCatalog = {
			catalog,
			expiresAt: now + ttlMs,
		};
	}

	return catalog;
}

export async function loadCodexModelCatalog(
	runner: CodexDebugModelsRunner,
): Promise<CodexModelCatalog> {
	try {
		return parseCodexDebugModelsOutput(await runner());
	} catch (error) {
		console.warn(
			`[llm/config] falling back to static Codex model catalog: ${error instanceof Error ? error.message : String(error)}`,
		);
		return CODEX_FALLBACK_MODEL_CATALOG;
	}
}

export function parseCodexDebugModelsOutput(raw: string): CodexModelCatalog {
	const parsed = JSON.parse(raw) as { models?: unknown };
	if (!Array.isArray(parsed.models)) {
		throw new Error('codex debug models output did not include a models array');
	}

	const models = parsed.models.flatMap(parseCodexModelEntry);
	if (models.length === 0) {
		throw new Error('codex debug models output did not include any visible list models');
	}

	const defaultModel = models.some(
		(model) => model.id === CODEX_FALLBACK_MODEL_CATALOG.defaultModel,
	)
		? CODEX_FALLBACK_MODEL_CATALOG.defaultModel
		: models[0].id;
	const defaultModelConfig = models.find((model) => model.id === defaultModel) ?? models[0];

	return {
		defaultModel,
		defaultReasoningEffort: defaultModelConfig.defaultReasoningEffort ?? 'medium',
		models,
		reasoningEfforts: uniqueReasoningEfforts(models),
		source: 'debug-models',
	};
}

export function clearCodexModelCatalogCache(): void {
	cachedCatalog = null;
}

function parseCodexModelEntry(entry: unknown): HarnessModelOption[] {
	if (!entry || typeof entry !== 'object') return [];

	const model = entry as Record<string, unknown>;
	if (model.visibility !== 'list') return [];

	const slug = typeof model.slug === 'string' ? model.slug.trim() : '';
	const label = typeof model.display_name === 'string' ? model.display_name.trim() : slug;
	const defaultReasoningEffort = parseReasoningEffort(model.default_reasoning_level);
	const reasoningEfforts = parseSupportedReasoningEfforts(model.supported_reasoning_levels);

	if (!slug || !defaultReasoningEffort || reasoningEfforts.length === 0) {
		return [];
	}

	return [
		{
			id: slug,
			label: label || slug,
			defaultReasoningEffort,
			reasoningEfforts,
		},
	];
}

function parseSupportedReasoningEfforts(value: unknown): ReasoningEffort[] {
	if (!Array.isArray(value)) return [];

	const efforts = value
		.map((item) => {
			if (typeof item === 'string') return parseReasoningEffort(item);
			if (item && typeof item === 'object') {
				return parseReasoningEffort((item as Record<string, unknown>).effort);
			}
			return undefined;
		})
		.filter((effort): effort is ReasoningEffort => effort !== undefined);

	return [...new Set(efforts)];
}

function parseReasoningEffort(value: unknown): ReasoningEffort | undefined {
	if (typeof value !== 'string') return undefined;
	return CODEX_REASONING_EFFORTS.includes(value as ReasoningEffort)
		? (value as ReasoningEffort)
		: undefined;
}

function uniqueReasoningEfforts(models: HarnessModelOption[]): ReasoningEffort[] {
	const efforts = models.flatMap((model) => [...(model.reasoningEfforts ?? [])]);
	return [...new Set(efforts)];
}

function runCodexDebugModels(): Promise<string> {
	return new Promise((resolve, reject) => {
		const proc = spawn('codex', ['debug', 'models'], { stdio: ['ignore', 'pipe', 'pipe'] });
		let stdout = '';
		let stderr = '';
		let settled = false;

		const timeout = setTimeout(() => {
			if (settled) return;
			settled = true;
			proc.kill('SIGTERM');
			reject(new Error(`codex debug models timed out after ${COMMAND_TIMEOUT_MS}ms`));
		}, COMMAND_TIMEOUT_MS);

		proc.stdout.on('data', (data: Buffer) => {
			stdout += data.toString();
		});
		proc.stderr.on('data', (data: Buffer) => {
			stderr += data.toString();
		});

		proc.on('close', (code) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);

			if (code !== 0) {
				reject(new Error(`codex debug models exited with code ${code}: ${stderr.trim()}`));
				return;
			}

			resolve(stdout);
		});

		proc.on('error', (error) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			reject(new Error(`failed to spawn codex debug models: ${error.message}`));
		});
	});
}

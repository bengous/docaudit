import type { ClientLlmCatalog, LlmSelection, ReasoningEffort } from '$lib/llm/types';
import { claudeAdapter } from './adapters/claude';
import { codexAdapter } from './adapters/codex';
import { CODEX_FALLBACK_MODEL_CATALOG, getCodexModelCatalog } from './codex-catalog';
import type { LiveHarnessConfig } from './types';

export class LlmConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'LlmConfigError';
	}
}

export interface LlmEnv {
	[key: string]: string | undefined;
	LLM_HARNESS?: string;
	LLM_MODEL?: string;
	LLM_REASONING_EFFORT?: string;
}

interface LlmSelectionInput {
	harness?: string;
	model?: string;
	reasoningEffort?: string;
}

const REASONING_EFFORTS = [
	'low',
	'medium',
	'high',
	'xhigh',
] as const satisfies readonly ReasoningEffort[];

const staticHarnesses: Record<string, LiveHarnessConfig> = {
	claude: {
		id: 'claude',
		label: 'Claude',
		executable: 'claude',
		defaultModel: 'sonnet',
		models: [
			{ id: 'sonnet', label: 'Sonnet' },
			{ id: 'haiku', label: 'Haiku' },
		],
		capabilities: {
			draftContinuity: 'resume-session',
			structuredOutput: 'json-schema-flag',
		},
		adapter: claudeAdapter,
	},
	codex: {
		id: 'codex',
		label: 'Codex',
		executable: 'codex',
		defaultModel: CODEX_FALLBACK_MODEL_CATALOG.defaultModel,
		defaultReasoningEffort: CODEX_FALLBACK_MODEL_CATALOG.defaultReasoningEffort,
		models: [],
		reasoningEfforts: CODEX_FALLBACK_MODEL_CATALOG.reasoningEfforts,
		capabilities: {
			draftContinuity: 'resend-context',
			structuredOutput: 'output-schema-file',
		},
		adapter: codexAdapter,
	},
};

const DEFAULT_HARNESS = 'claude';

export async function getHarnessConfig(harnessId: string): Promise<LiveHarnessConfig> {
	const harnesses = await getLiveHarnesses();
	const harness = harnesses[harnessId];
	if (!harness) {
		throw new LlmConfigError(
			`Unknown LLM harness "${harnessId}". Available harnesses: ${Object.keys(harnesses).join(', ')}.`,
		);
	}
	return harness;
}

export async function getClientLlmCatalog(): Promise<ClientLlmCatalog> {
	const harnesses = await getLiveHarnesses();
	return {
		defaultHarness: DEFAULT_HARNESS,
		harnesses: Object.values(harnesses).map(
			({
				id,
				label,
				defaultModel,
				defaultReasoningEffort,
				models,
				reasoningEfforts,
				capabilities,
			}) => ({
				id,
				label,
				defaultModel,
				defaultReasoningEffort,
				models,
				reasoningEfforts,
				capabilities,
			}),
		),
	};
}

export async function resolveLlmSelection(
	input: LlmSelectionInput,
	env: LlmEnv = {},
): Promise<LlmSelection> {
	const harnessId = firstNonEmpty(input.harness, env.LLM_HARNESS, DEFAULT_HARNESS);
	const harness = await getHarnessConfig(harnessId);
	const model = firstNonEmpty(input.model, env.LLM_MODEL, harness.defaultModel);
	const reasoningEffort = resolveReasoningEffort(input.reasoningEffort, env.LLM_REASONING_EFFORT);
	const modelConfig = harness.models.find((option) => option.id === model);

	if (!modelConfig) {
		throw new LlmConfigError(
			`Unknown model "${model}" for harness "${harness.id}". Available models: ${harness.models
				.map((option) => option.id)
				.join(', ')}.`,
		);
	}

	const supportedReasoningEfforts = modelConfig.reasoningEfforts ?? harness.reasoningEfforts;
	const selectedReasoningEffort =
		reasoningEffort ?? modelConfig.defaultReasoningEffort ?? harness.defaultReasoningEffort;

	if (selectedReasoningEffort && !supportedReasoningEfforts?.includes(selectedReasoningEffort)) {
		throw new LlmConfigError(
			`Reasoning effort "${selectedReasoningEffort}" is not configured for model "${model}" on harness "${harness.id}".`,
		);
	}

	return {
		harness: harness.id,
		model,
		...(selectedReasoningEffort ? { reasoningEffort: selectedReasoningEffort } : {}),
	};
}

async function getLiveHarnesses(): Promise<Record<string, LiveHarnessConfig>> {
	const codexCatalog = await getCodexModelCatalog();
	return {
		...staticHarnesses,
		codex: {
			...staticHarnesses.codex,
			defaultModel: codexCatalog.defaultModel,
			defaultReasoningEffort: codexCatalog.defaultReasoningEffort,
			models: codexCatalog.models,
			reasoningEfforts: codexCatalog.reasoningEfforts,
		},
	};
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
	for (const value of values) {
		const trimmed = value?.trim();
		if (trimmed) return trimmed;
	}
	return '';
}

function resolveReasoningEffort(
	input: string | null | undefined,
	envValue: string | null | undefined,
): ReasoningEffort | undefined {
	const value = firstNonEmpty(input, envValue);
	if (!value) return undefined;
	if (REASONING_EFFORTS.includes(value as ReasoningEffort)) {
		return value as ReasoningEffort;
	}
	throw new LlmConfigError(
		`Unknown reasoning effort "${value}". Available values: ${REASONING_EFFORTS.join(', ')}.`,
	);
}

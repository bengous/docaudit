import type { ClientLlmCatalog, LlmSelection, ReasoningEffort } from '$lib/llm/types';
import { claudeAdapter } from './adapters/claude';
import { codexAdapter } from './adapters/codex';
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

const REASONING_EFFORTS = ['low', 'medium', 'high'] as const satisfies readonly ReasoningEffort[];

const liveHarnesses: Record<string, LiveHarnessConfig> = {
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
		defaultModel: 'gpt-5.5',
		defaultReasoningEffort: 'medium',
		models: [
			{ id: 'gpt-5.4', label: 'GPT-5.4' },
			{ id: 'gpt-5.4-mini', label: 'GPT-5.4 Mini' },
			{ id: 'gpt-5.3-codex-spark', label: 'GPT-5.3 Codex Spark' },
			{ id: 'gpt-5.5', label: 'GPT-5.5' },
		],
		reasoningEfforts: REASONING_EFFORTS,
		capabilities: {
			draftContinuity: 'resend-context',
			structuredOutput: 'output-schema-file',
		},
		adapter: codexAdapter,
	},
};

const DEFAULT_HARNESS = 'claude';

export function getHarnessConfig(harnessId: string): LiveHarnessConfig {
	const harness = liveHarnesses[harnessId as keyof typeof liveHarnesses];
	if (!harness) {
		throw new LlmConfigError(
			`Unknown LLM harness "${harnessId}". Available harnesses: ${Object.keys(liveHarnesses).join(', ')}.`,
		);
	}
	return harness;
}

export function getClientLlmCatalog(): ClientLlmCatalog {
	return {
		defaultHarness: DEFAULT_HARNESS,
		harnesses: Object.values(liveHarnesses).map(
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

export function resolveLlmSelection(input: LlmSelectionInput, env: LlmEnv = {}): LlmSelection {
	const harnessId = firstNonEmpty(input.harness, env.LLM_HARNESS, DEFAULT_HARNESS);
	const harness = getHarnessConfig(harnessId);
	const model = firstNonEmpty(input.model, env.LLM_MODEL, harness.defaultModel);
	const reasoningEffort = resolveReasoningEffort(input.reasoningEffort, env.LLM_REASONING_EFFORT);

	if (!harness.models.some((option) => option.id === model)) {
		throw new LlmConfigError(
			`Unknown model "${model}" for harness "${harness.id}". Available models: ${harness.models
				.map((option) => option.id)
				.join(', ')}.`,
		);
	}

	if (reasoningEffort && !harness.reasoningEfforts?.includes(reasoningEffort)) {
		throw new LlmConfigError(
			`Reasoning effort "${reasoningEffort}" is not configured for harness "${harness.id}".`,
		);
	}

	return {
		harness: harness.id,
		model,
		...(reasoningEffort ? { reasoningEffort } : {}),
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

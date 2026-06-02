import type {
	ClientHarnessConfig,
	HarnessCapabilities,
	HarnessModelOption,
	ReasoningEffort,
} from '$lib/llm/types';
import type { CommandResult, CommandRunner, PreparedCommand } from './runner';

export type JsonSchema = Record<string, unknown>;
export type LlmTask = 'analysis' | 'draft';

export interface StructuredOutput {
	content: string;
	continuityId?: string;
}

export interface HarnessInvocation {
	task: LlmTask;
	model: string;
	reasoningEffort?: ReasoningEffort;
	prompt: string;
	schema: JsonSchema;
	timeoutMs: number;
	continuityId?: string;
	useResume: boolean;
}

export interface HarnessAdapter {
	prepareCommand(input: HarnessInvocation): Promise<PreparedCommand>;
	parseOutput(result: CommandResult, command: PreparedCommand): Promise<StructuredOutput>;
}

export interface LiveHarnessConfig extends ClientHarnessConfig {
	executable: string;
	adapter: HarnessAdapter;
}

export interface RunStructuredPromptInput {
	harness: LiveHarnessConfig;
	task: LlmTask;
	model: string;
	reasoningEffort?: ReasoningEffort;
	prompt: string;
	schema: JsonSchema;
	timeoutMs: number;
	continuityId?: string;
	useResume?: boolean;
	runner?: CommandRunner;
}

export type { HarnessCapabilities, HarnessModelOption, ReasoningEffort };

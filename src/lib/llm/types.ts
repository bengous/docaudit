export type DraftContinuityMode = 'resume-session' | 'resend-context';
export type ReasoningEffort = 'low' | 'medium' | 'high';

export interface HarnessModelOption {
	id: string;
	label: string;
}

export interface HarnessCapabilities {
	draftContinuity: DraftContinuityMode;
	structuredOutput: 'json-schema-flag' | 'output-schema-file';
}

export interface ClientHarnessConfig {
	id: string;
	label: string;
	defaultModel: string;
	defaultReasoningEffort?: ReasoningEffort;
	models: HarnessModelOption[];
	reasoningEfforts?: readonly ReasoningEffort[];
	capabilities: HarnessCapabilities;
}

export interface ClientLlmCatalog {
	defaultHarness: string;
	harnesses: ClientHarnessConfig[];
}

export interface LlmSelection {
	harness: string;
	model: string;
	reasoningEffort?: ReasoningEffort;
}

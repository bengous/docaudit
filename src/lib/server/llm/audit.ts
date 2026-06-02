import type { LlmSelection } from '$lib/llm/types';
import type { AnalysisResponse, DraftData } from '$lib/types';
import { getHarnessConfig } from './config';
import {
	analysisJsonSchema,
	buildAuditPrompt,
	buildDraftPrompt,
	buildResumeDraftPrompt,
	draftJsonSchema,
} from './prompts';
import { cleanupPreparedCommand, runCommand, type CommandRunner } from './runner';
import type { RunStructuredPromptInput, StructuredOutput } from './types';

const ANALYZE_TIMEOUT_MS = 120_000;
const DRAFT_TIMEOUT_MS = 120_000;

export interface AuditDocumentInput {
	documentText: string;
	selection: LlmSelection;
	runner?: CommandRunner;
}

export interface AnalysisRunResult extends AnalysisResponse {
	continuityId: string;
	sessionId?: string;
	harness: string;
	model: string;
	draftContinuity: 'resume-session' | 'resend-context';
}

export interface GenerateDraftInput {
	selection: LlmSelection;
	continuityId?: string;
	documentText?: string;
	analysis?: AnalysisResponse;
	runner?: CommandRunner;
}

export async function auditDocument(input: AuditDocumentInput): Promise<AnalysisRunResult> {
	const harness = await getHarnessConfig(input.selection.harness);
	await assertModelSupported(input.selection);

	const prompt = buildAuditPrompt(input.documentText);
	console.log(`[analyze] harness=${harness.id}, model=${input.selection.model}`);
	console.log(`[analyze] prompt length: ${prompt.length} chars`);

	const output = await runStructuredPrompt({
		harness,
		task: 'analysis',
		model: input.selection.model,
		reasoningEffort: input.selection.reasoningEffort,
		prompt,
		schema: analysisJsonSchema,
		timeoutMs: ANALYZE_TIMEOUT_MS,
		runner: input.runner,
	});

	const analysis = JSON.parse(output.content) as AnalysisResponse;
	const continuityId = output.continuityId ?? '';
	console.log(
		`[analyze] parsed, continuityId=${continuityId}, content length=${output.content.length}`,
	);

	return {
		...analysis,
		continuityId,
		sessionId: continuityId || undefined,
		harness: harness.id,
		model: input.selection.model,
		draftContinuity: harness.capabilities.draftContinuity,
	};
}

export async function generateDraft(input: GenerateDraftInput): Promise<DraftData> {
	const harness = await getHarnessConfig(input.selection.harness);
	await assertModelSupported(input.selection);

	const shouldResume =
		harness.capabilities.draftContinuity === 'resume-session' && Boolean(input.continuityId);

	if (!shouldResume && (!input.documentText || !input.analysis)) {
		throw new Error(
			`${harness.label} draft generation requires the original document and audit result because this harness cannot resume the analysis session.`,
		);
	}

	const prompt = shouldResume
		? buildResumeDraftPrompt()
		: buildDraftPrompt(input.documentText ?? '', input.analysis as AnalysisResponse);

	console.log(
		`[generate-draft] harness=${harness.id}, model=${input.selection.model}, continuity=${shouldResume ? 'resume-session' : 'resend-context'}`,
	);

	const output = await runStructuredPrompt({
		harness,
		task: 'draft',
		model: input.selection.model,
		reasoningEffort: input.selection.reasoningEffort,
		prompt,
		schema: draftJsonSchema,
		timeoutMs: DRAFT_TIMEOUT_MS,
		continuityId: shouldResume ? input.continuityId : undefined,
		useResume: shouldResume,
		runner: input.runner,
	});

	return JSON.parse(output.content) as DraftData;
}

export async function runStructuredPrompt(
	input: RunStructuredPromptInput,
): Promise<StructuredOutput> {
	const command = await input.harness.adapter.prepareCommand({
		task: input.task,
		model: input.model,
		reasoningEffort: input.reasoningEffort,
		prompt: input.prompt,
		schema: input.schema,
		timeoutMs: input.timeoutMs,
		continuityId: input.continuityId,
		useResume: input.useResume ?? false,
	});

	try {
		const result = await (input.runner ?? runCommand)(command);
		return await input.harness.adapter.parseOutput(result, command);
	} finally {
		await cleanupPreparedCommand(command);
	}
}

async function assertModelSupported(selection: LlmSelection): Promise<void> {
	const harness = await getHarnessConfig(selection.harness);
	if (!harness.models.some((option) => option.id === selection.model)) {
		throw new Error(
			`Model "${selection.model}" is not configured for harness "${selection.harness}".`,
		);
	}
}

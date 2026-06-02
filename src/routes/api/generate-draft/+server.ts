import { json } from '@sveltejs/kit';
import { extractText } from 'unpdf';
import { env } from '$env/dynamic/private';
import { generateDraftMock } from '$lib/audit/mock';
import type { LlmSelection } from '$lib/llm/types';
import { generateDraft } from '$lib/server/llm/audit';
import { getHarnessConfig, LlmConfigError, resolveLlmSelection } from '$lib/server/llm/config';
import type { AnalysisResponse } from '$lib/types';
import { compilePdf } from '$lib/typst/compile';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	let draftRequest: DraftRequestData;
	try {
		draftRequest = await readDraftRequest(request);
	} catch (error) {
		if (error instanceof DraftRequestError) {
			return json({ error: error.message }, { status: 400 });
		}
		throw error;
	}

	const useMock =
		draftRequest.mockOverride !== undefined
			? draftRequest.mockOverride === true
			: env.MOCK_MODE !== 'false';
	console.log(
		`[generate-draft] MOCK_MODE=${env.MOCK_MODE}, override=${draftRequest.mockOverride} -> ${useMock ? 'MOCK' : 'LIVE'}${draftRequest.continuityId ? `, continuity ${draftRequest.continuityId}` : ''}`,
	);

	let pdfBytes: Uint8Array;

	if (useMock) {
		pdfBytes = await generateDraftMock();
	} else {
		let selection: LlmSelection;
		try {
			selection = resolveLlmSelection(
				{
					harness: draftRequest.harness,
					model: draftRequest.model,
					reasoningEffort: draftRequest.reasoningEffort,
				},
				env,
			);
		} catch (error) {
			if (error instanceof LlmConfigError) {
				return json({ error: error.message }, { status: 400 });
			}
			throw error;
		}

		const harness = getHarnessConfig(selection.harness);
		const needsContext =
			harness.capabilities.draftContinuity !== 'resume-session' || !draftRequest.continuityId;

		let documentText: string | undefined;
		if (needsContext) {
			if (!draftRequest.file) {
				return json(
					{
						error:
							'Draft generation requires the original PDF when the selected harness cannot resume the analysis session.',
					},
					{ status: 400 },
				);
			}
			if (draftRequest.file.type !== 'application/pdf') {
				return json({ error: 'The file must be a PDF' }, { status: 400 });
			}
			if (!draftRequest.analysis) {
				return json(
					{
						error:
							'Draft generation requires the audit result when the selected harness cannot resume the analysis session.',
					},
					{ status: 400 },
				);
			}

			const buffer = new Uint8Array(await draftRequest.file.arrayBuffer());
			const { text } = await extractText(buffer);
			documentText = Array.isArray(text) ? text.join('\n') : text;
		}

		const draftData = await generateDraft({
			selection,
			continuityId: draftRequest.continuityId,
			documentText,
			analysis: draftRequest.analysis,
		});
		console.log(
			`[generate-draft] ${selection.harness} returned ${draftData.sections.length} sections, compiling PDF...`,
		);
		pdfBytes = await compilePdf(draftData);
	}

	console.log(`[generate-draft] done, PDF ${pdfBytes.length} bytes`);
	return new Response(pdfBytes.buffer as ArrayBuffer, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'inline; filename="improved-technical-response.pdf"',
		},
	});
};

interface DraftRequestData {
	harness?: string;
	model?: string;
	reasoningEffort?: string;
	continuityId?: string;
	mockOverride?: boolean;
	file?: File;
	analysis?: AnalysisResponse;
}

class DraftRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DraftRequestError';
	}
}

async function readDraftRequest(request: Request): Promise<DraftRequestData> {
	const contentType = request.headers.get('Content-Type') ?? '';
	if (contentType.includes('application/json')) {
		const body = (await request.json()) as Record<string, unknown>;
		return {
			harness: stringValue(body.harness),
			model: stringValue(body.model),
			reasoningEffort: stringValue(body.reasoningEffort),
			continuityId: stringValue(body.continuityId) ?? stringValue(body.sessionId),
			mockOverride: typeof body.mock === 'boolean' ? body.mock : undefined,
			analysis: isAnalysisResponse(body.analysis) ? body.analysis : undefined,
		};
	}

	const formData = await request.formData();
	const analysisJson = formValue(formData.get('analysis'));
	const file = formData.get('file');

	return {
		harness: formValue(formData.get('harness')),
		model: formValue(formData.get('model')),
		reasoningEffort: formValue(formData.get('reasoningEffort')),
		continuityId: formValue(formData.get('continuityId')) ?? formValue(formData.get('sessionId')),
		mockOverride: booleanFormValue(formData.get('mock')),
		file: file instanceof File ? file : undefined,
		analysis: parseAnalysisJson(analysisJson),
	};
}

function formValue(value: FormDataEntryValue | null): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

function booleanFormValue(value: FormDataEntryValue | null): boolean | undefined {
	if (typeof value !== 'string') return undefined;
	if (value === 'true') return true;
	if (value === 'false') return false;
	return undefined;
}

function isAnalysisResponse(value: unknown): value is AnalysisResponse {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<AnalysisResponse>;
	return (
		Array.isArray(candidate.heuristics) &&
		typeof candidate.summary === 'object' &&
		candidate.summary !== null
	);
}

function parseAnalysisJson(value: string | undefined): AnalysisResponse | undefined {
	if (!value) return undefined;
	try {
		return JSON.parse(value) as AnalysisResponse;
	} catch {
		throw new DraftRequestError('Invalid audit result JSON.');
	}
}

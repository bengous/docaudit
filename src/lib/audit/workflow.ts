import { MAX_FILE_SIZE } from '$lib/audit/ui';
import type { LlmSelection } from '$lib/llm/types';
import type { AnalysisResponse } from '$lib/types';

export type ValidationResult = { ok: true } | { ok: false; error: string };
type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export function validatePdfFile(file: File): ValidationResult {
	if (file.type !== 'application/pdf') {
		return { ok: false, error: 'Unsupported format. Please upload a PDF file.' };
	}
	if (file.size > MAX_FILE_SIZE) {
		return { ok: false, error: 'File too large. Maximum size: 10 MB.' };
	}
	return { ok: true };
}

export async function analyzeDocument(
	file: File,
	selection: LlmSelection,
	mockMode?: boolean,
	fetchFn: FetchLike = fetch,
): Promise<{ analysis: AnalysisResponse; continuityId: string }> {
	const form = new FormData();
	form.append('file', file);
	form.append('harness', selection.harness);
	form.append('model', selection.model);
	if (selection.reasoningEffort) form.append('reasoningEffort', selection.reasoningEffort);
	if (mockMode !== undefined) form.append('mock', String(mockMode));

	const res = await fetchFn('/api/analyze', {
		method: 'POST',
		body: form,
	});

	if (!res.ok) {
		throw new Error('Analysis failed. Check your connection and try again.');
	}

	const data = (await res.json()) as AnalysisResponse & {
		continuityId?: string;
		sessionId?: string;
	};
	return {
		analysis: data,
		continuityId: data.continuityId ?? data.sessionId ?? '',
	};
}

export interface GenerateImprovedDraftInput {
	file: File | null;
	analysis: AnalysisResponse | null;
	continuityId: string;
	selection: LlmSelection;
	mockMode?: boolean;
}

export async function generateImprovedDraft(
	input: GenerateImprovedDraftInput,
	fetchFn: FetchLike = fetch,
): Promise<Blob> {
	const form = new FormData();
	form.append('harness', input.selection.harness);
	form.append('model', input.selection.model);
	if (input.selection.reasoningEffort) {
		form.append('reasoningEffort', input.selection.reasoningEffort);
	}
	form.append('continuityId', input.continuityId);
	if (input.mockMode !== undefined) form.append('mock', String(input.mockMode));
	if (input.file) form.append('file', input.file);
	if (input.analysis) form.append('analysis', JSON.stringify(input.analysis));

	const res = await fetchFn('/api/generate-draft', {
		method: 'POST',
		body: form,
	});

	if (!res.ok || res.headers.get('Content-Type')?.includes('application/json')) {
		throw new Error('Generation failed. Check your connection and try again.');
	}

	return res.blob();
}

export function toggleExpandedCard(expandedCards: Set<string>, id: string): Set<string> {
	const next = new Set(expandedCards);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	return next;
}

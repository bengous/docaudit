import { MAX_FILE_SIZE } from '$lib/audit/ui';
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
	model: 'sonnet' | 'haiku' = 'sonnet',
	mockMode?: boolean,
	fetchFn: FetchLike = fetch,
): Promise<{ analysis: AnalysisResponse; sessionId: string }> {
	const form = new FormData();
	form.append('file', file);
	form.append('model', model);
	if (mockMode !== undefined) form.append('mock', String(mockMode));

	const res = await fetchFn('/api/analyze', {
		method: 'POST',
		body: form,
	});

	if (!res.ok) {
		throw new Error('Analysis failed. Check your connection and try again.');
	}

	const data = (await res.json()) as AnalysisResponse & { sessionId?: string };
	return {
		analysis: data,
		sessionId: data.sessionId ?? '',
	};
}

export async function generateImprovedDraft(
	sessionId: string,
	model: 'sonnet' | 'haiku' = 'sonnet',
	mockMode?: boolean,
	fetchFn: FetchLike = fetch,
): Promise<Blob> {
	const res = await fetchFn('/api/generate-draft', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sessionId, model, mock: mockMode }),
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

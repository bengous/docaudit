import { mockAnalysis } from '$lib/fixtures/mock-analysis';
import { mockDraftData } from '$lib/fixtures/mock-draft-data';
import type { AnalysisResponse } from '$lib/types';
import { compilePdf } from '$lib/typst/compile';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function auditDocumentMock(): Promise<AnalysisResponse & { sessionId: string }> {
	await delay(1200);
	return { ...mockAnalysis, sessionId: 'mock-session' };
}

export async function generateDraftMock(): Promise<Uint8Array> {
	await delay(1500);
	return compilePdf(mockDraftData);
}

import { describe, expect, it } from 'bun:test';
import {
	analyzeDocument,
	generateImprovedDraft,
	toggleExpandedCard,
	validatePdfFile,
} from './workflow';

const selection = { harness: 'claude', model: 'sonnet' };
const codexSelection = { harness: 'codex', model: 'gpt-5.4', reasoningEffort: 'low' as const };
const analysis = {
	summary: {
		ok: 1,
		aClarifier: 0,
		manquant: 0,
		incoherent: 0,
		genericFlag: false,
		score: 90,
	},
	heuristics: [],
};

describe('workflow helpers', () => {
	it('rejects non-pdf files', () => {
		const file = new File(['hello'], 'doc.txt', { type: 'text/plain' });
		const result = validatePdfFile(file);
		expect(result.ok).toBe(false);
	});

	it('toggles expanded cards', () => {
		const initial = new Set<string>(['A1']);
		expect(toggleExpandedCard(initial, 'A1').has('A1')).toBe(false);
		expect(toggleExpandedCard(initial, 'A2').has('A2')).toBe(true);
	});

	it('returns analysis and session id on successful analyze call', async () => {
		const file = new File(['pdf'], 'memoire.pdf', { type: 'application/pdf' });
		const fakeFetch = async (_input: string | URL | Request, init?: RequestInit) => {
			const form = init?.body as FormData;
			expect(form.get('harness')).toBe('codex');
			expect(form.get('model')).toBe('gpt-5.4');
			expect(form.get('reasoningEffort')).toBe('low');
			expect(form.get('mock')).toBeNull();
			return new Response(
				JSON.stringify({
					continuityId: 'sess_123',
					...analysis,
				}),
				{ status: 200 },
			);
		};

		const result = await analyzeDocument(file, codexSelection, undefined, fakeFetch);
		expect(result.continuityId).toBe('sess_123');
		expect(result.analysis.summary.score).toBe(90);
	});

	it('returns a blob on successful draft generation', async () => {
		const file = new File(['pdf'], 'memoire.pdf', { type: 'application/pdf' });
		const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
		const fakeFetch = async (_input: string | URL | Request, init?: RequestInit) => {
			const form = init?.body as FormData;
			expect(form.get('continuityId')).toBe('sess_123');
			expect(form.get('harness')).toBe('codex');
			expect(form.get('model')).toBe('gpt-5.4');
			expect(form.get('reasoningEffort')).toBe('low');
			expect(form.get('file')).toBeInstanceOf(File);
			expect(form.get('analysis')).toBe(JSON.stringify(analysis));
			return new Response(pdfBytes, {
				status: 200,
				headers: { 'Content-Type': 'application/pdf' },
			});
		};

		const blob = await generateImprovedDraft(
			{ file, analysis, continuityId: 'sess_123', selection: codexSelection },
			fakeFetch,
		);
		expect(blob).toBeInstanceOf(Blob);
		expect(blob.size).toBe(4);
	});

	it('passes mock override through live workflow requests', async () => {
		const file = new File(['pdf'], 'memoire.pdf', { type: 'application/pdf' });
		const fakeAnalyzeFetch = async (_input: string | URL | Request, init?: RequestInit) => {
			const form = init?.body as FormData;
			expect(form.get('mock')).toBe('true');
			return new Response(JSON.stringify({ continuityId: 'mock-session', ...analysis }), {
				status: 200,
			});
		};
		const fakeDraftFetch = async (_input: string | URL | Request, init?: RequestInit) => {
			const form = init?.body as FormData;
			expect(form.get('mock')).toBe('true');
			return new Response(new Uint8Array([0x25]), {
				status: 200,
				headers: { 'Content-Type': 'application/pdf' },
			});
		};

		await analyzeDocument(file, selection, true, fakeAnalyzeFetch);
		await generateImprovedDraft(
			{ file, analysis, continuityId: 'mock-session', selection, mockMode: true },
			fakeDraftFetch,
		);
	});

	it('throws when draft generation fails', async () => {
		const failingFetch = async () => new Response(null, { status: 500 });
		expect(
			generateImprovedDraft(
				{ file: null, analysis: null, continuityId: 'sess_123', selection },
				failingFetch,
			),
		).rejects.toThrow('Generation failed. Check your connection and try again.');
	});
});

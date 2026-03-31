import { describe, expect, it } from 'bun:test';
import {
	analyzeDocument,
	generateImprovedDraft,
	toggleExpandedCard,
	validatePdfFile,
} from './workflow';

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
		const fakeFetch = async () =>
			new Response(
				JSON.stringify({
					sessionId: 'sess_123',
					summary: {
						ok: 1,
						aClarifier: 0,
						manquant: 0,
						incoherent: 0,
						genericFlag: false,
						score: 90,
					},
					heuristics: [],
				}),
				{ status: 200 },
			);

		const result = await analyzeDocument(file, 'sonnet', undefined, fakeFetch);
		expect(result.sessionId).toBe('sess_123');
		expect(result.analysis.summary.score).toBe(90);
	});

	it('returns a blob on successful draft generation', async () => {
		const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
		const fakeFetch = async () =>
			new Response(pdfBytes, {
				status: 200,
				headers: { 'Content-Type': 'application/pdf' },
			});

		const blob = await generateImprovedDraft('sess_123', 'sonnet', undefined, fakeFetch);
		expect(blob).toBeInstanceOf(Blob);
		expect(blob.size).toBe(4);
	});

	it('throws when draft generation fails', async () => {
		const failingFetch = async () => new Response(null, { status: 500 });
		expect(generateImprovedDraft('sess_123', 'sonnet', undefined, failingFetch)).rejects.toThrow(
			'La generation a echoue. Verifiez votre connexion et reessayez.',
		);
	});
});

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { generateDraft } from '$lib/claude/draft';
import { generateDraftMock } from '$lib/claude/mock';
import { compilePdf } from '$lib/typst/compile';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { sessionId, model: rawModel, mock: mockOverride } = await request.json();

	const useMock = mockOverride !== undefined ? mockOverride === true : env.MOCK_MODE !== 'false';
	console.log(
		`[generate-draft] MOCK_MODE=${env.MOCK_MODE}, override=${mockOverride} -> ${useMock ? 'MOCK' : 'REAL CLAUDE'}${sessionId ? `, resuming session ${sessionId}` : ''}`,
	);

	const model = rawModel === 'haiku' ? ('haiku' as const) : ('sonnet' as const);

	let pdfBytes: Uint8Array;

	if (useMock) {
		pdfBytes = await generateDraftMock();
	} else {
		const draftData = await generateDraft('', sessionId, model);
		console.log(
			`[generate-draft] Claude returned ${draftData.sections.length} sections, compiling PDF...`,
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

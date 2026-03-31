import { json } from '@sveltejs/kit';
import { extractText } from 'unpdf';
import { env } from '$env/dynamic/private';
import { auditDocument } from '$lib/claude/analyze';
import { auditDocumentMock } from '$lib/claude/mock';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const t0 = Date.now();
	const ts = () => `+${((Date.now() - t0) / 1000).toFixed(1)}s`;

	const formData = await request.formData();
	const mockOverride = formData.get('mock');
	const useMock = mockOverride !== null ? mockOverride === 'true' : env.MOCK_MODE !== 'false';
	console.log(
		`[api/analyze ${ts()}] MOCK_MODE=${env.MOCK_MODE}, override=${mockOverride} -> ${useMock ? 'MOCK' : 'REAL CLAUDE'}`,
	);

	if (useMock) {
		const result = await auditDocumentMock();
		console.log(`[api/analyze ${ts()}] mock done, score=${result.summary.score}`);
		return json(result);
	}

	const file = formData.get('file');

	if (!file || !(file instanceof File)) {
		return json({ error: 'A PDF file is required' }, { status: 400 });
	}

	if (file.type !== 'application/pdf') {
		return json({ error: 'The file must be a PDF' }, { status: 400 });
	}

	console.log(`[api/analyze ${ts()}] file: ${file.name} (${file.size} bytes, ${file.type})`);

	// Extract text from PDF server-side
	console.log(`[api/analyze ${ts()}] extracting text from PDF...`);
	const buffer = new Uint8Array(await file.arrayBuffer());
	const { text, totalPages } = await extractText(buffer);
	const documentText = Array.isArray(text) ? text.join('\n') : text;
	console.log(
		`[api/analyze ${ts()}] extracted ${documentText.length} chars from ${totalPages} page(s)`,
	);

	const model = (formData.get('model') as string) === 'haiku' ? 'haiku' : 'sonnet';
	const result = await auditDocument(documentText, model);
	console.log(
		`[api/analyze ${ts()}] done! score=${result.summary.score}, sessionId=${result.sessionId}`,
	);
	return json(result);
};

import { json } from '@sveltejs/kit';
import { extractText } from 'unpdf';
import { env } from '$env/dynamic/private';
import { auditDocumentMock } from '$lib/audit/mock';
import type { LlmSelection } from '$lib/llm/types';
import { auditDocument } from '$lib/server/llm/audit';
import { LlmConfigError, resolveLlmSelection } from '$lib/server/llm/config';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const t0 = Date.now();
	const ts = () => `+${((Date.now() - t0) / 1000).toFixed(1)}s`;

	const formData = await request.formData();
	const mockOverride = formData.get('mock');
	const useMock = mockOverride !== null ? mockOverride === 'true' : env.MOCK_MODE !== 'false';
	console.log(
		`[api/analyze ${ts()}] MOCK_MODE=${env.MOCK_MODE}, override=${mockOverride} -> ${useMock ? 'MOCK' : 'LIVE'}`,
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

	let selection: LlmSelection;
	try {
		selection = await resolveLlmSelection(
			{
				harness: formValue(formData.get('harness')),
				model: formValue(formData.get('model')),
				reasoningEffort: formValue(formData.get('reasoningEffort')),
			},
			env,
		);
	} catch (error) {
		if (error instanceof LlmConfigError) {
			return json({ error: error.message }, { status: 400 });
		}
		throw error;
	}

	const result = await auditDocument({ documentText, selection });
	console.log(
		`[api/analyze ${ts()}] done! harness=${selection.harness}, model=${selection.model}, score=${result.summary.score}, continuityId=${result.continuityId}`,
	);
	return json(result);
};

function formValue(value: FormDataEntryValue | null): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

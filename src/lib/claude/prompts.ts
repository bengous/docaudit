import { heuristicsPrompt } from '$lib/fixtures/heuristics';

export const auditSystemPrompt = `You are an auditor specialized in evaluating technical proposals for public procurement tenders.

You are given a document to audit. You must evaluate its quality and completeness according to the following heuristics.

${heuristicsPrompt}

Return ONLY a valid JSON object (no markdown, no explanation outside the JSON) matching the following schema:

{
  "heuristics": [
    {
      "id": "string — identifier (e.g. \"H1\")",
      "title": "string — short heuristic title",
      "status": "\"ok\" | \"a_clarifier\" | \"manquant\" | \"incoherent\" | \"drapeau\"",
      "excerpt": "string — relevant excerpt from the document (empty if the point is absent)",
      "explanation": "string — explanation of the assigned status",
      "suggestion": "string — concrete action to improve the document"
    }
  ],
  "summary": {
    "ok": "number — count of OK points",
    "aClarifier": "number — count of points needing clarification",
    "manquant": "number — count of missing points",
    "incoherent": "number — count of inconsistencies",
    "genericFlag": "boolean — true if H7 (flag) is triggered",
    "score": "number — overall score out of 100"
  }
}

Rules:
- Return ONLY valid JSON. No markdown blocks, no surrounding text.
- One element per heuristic (H1 to H8), in order.
- Be precise, factual, and concise. Write in English.`;

export const draftSystemPrompt = `You are a technical writer specialized in technical proposals for public procurement tenders.

You are given:
1. An original document (imperfect)
2. A detailed audit of points to improve

Your mission: rewrite the document by addressing all points raised in the audit, filling in the structured fields.

Rules for the "contenu" field of each section:
- Separate paragraphs with two line breaks
- For bullet lists, prefix each item with "- "
- Be concrete and specific (no generic wording)
- Keep a professional tone appropriate for public procurement
- Address each missing, unclear, or inconsistent point
- Write in English.`;

export const draftJsonSchema = {
	type: 'object',
	properties: {
		entreprise: {
			type: 'object',
			properties: {
				nom: { type: 'string' },
				adresse: { type: 'string' },
				email: { type: 'string' },
				contact: { type: 'string' },
			},
			required: ['nom', 'adresse', 'email', 'contact'],
		},
		marche: {
			type: 'object',
			properties: {
				titre: { type: 'string' },
				sousTitre: { type: 'string' },
				date: { type: 'string' },
				reference: { type: 'string' },
			},
			required: ['titre', 'sousTitre', 'date', 'reference'],
		},
		sections: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					titre: { type: 'string' },
					contenu: { type: 'string' },
				},
				required: ['titre', 'contenu'],
			},
		},
	},
	required: ['entreprise', 'marche', 'sections'],
};

export const analysisJsonSchema = {
	type: 'object',
	properties: {
		heuristics: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					title: { type: 'string' },
					status: {
						type: 'string',
						enum: ['ok', 'a_clarifier', 'manquant', 'incoherent', 'drapeau'],
					},
					excerpt: { type: 'string' },
					explanation: { type: 'string' },
					suggestion: { type: 'string' },
				},
				required: ['id', 'title', 'status', 'excerpt', 'explanation', 'suggestion'],
			},
		},
		summary: {
			type: 'object',
			properties: {
				ok: { type: 'number' },
				aClarifier: { type: 'number' },
				manquant: { type: 'number' },
				incoherent: { type: 'number' },
				genericFlag: { type: 'boolean' },
				score: { type: 'number' },
			},
			required: ['ok', 'aClarifier', 'manquant', 'incoherent', 'genericFlag', 'score'],
		},
	},
	required: ['heuristics', 'summary'],
};

import type { AnalysisResponse } from '$lib/types';

export const mockAnalysis: AnalysisResponse = {
	heuristics: [
		{
			id: 'H1',
			title: 'Tender scope understood',
			status: 'a_clarifier',
			excerpt:
				'We propose replacing the existing light fixtures with a new high-performance LED range.',
			explanation:
				'The document mentions LED fixtures but remains vague about the context: no reference to the municipal building, public reception, or energy performance improvement objective.',
			suggestion:
				'Explicitly state the context: municipal building open to the public, energy performance improvement and lighting comfort objectives.',
		},
		{
			id: 'H2',
			title: 'Timeline and schedule covered',
			status: 'manquant',
			excerpt: '',
			explanation:
				'No deadline, no schedule, no phasing. The document does not address the timeline constraint at all.',
			suggestion:
				'Add a commitment to the completion date, a preliminary schedule, and phased intervention plan.',
		},
		{
			id: 'H3',
			title: 'Occupied-site constraints covered',
			status: 'manquant',
			excerpt:
				'The intervention will be organized flexibly according to the progress of the works.',
			explanation:
				'No concrete measures for maintaining access, limiting disruption, or organizing work in an occupied site. The wording remains evasive.',
			suggestion:
				'Describe concrete measures: working by zones, adapted hours, maintaining circulation, informing occupants.',
		},
		{
			id: 'H4',
			title: 'Site safety covered',
			status: 'a_clarifier',
			excerpt: 'Our teams will apply the standard site safety rules.',
			explanation:
				'"Standard safety rules" is too vague. No mention of barriers, signage, PPE, or occupant protection.',
			suggestion:
				'Detail the measures: zone barriers, temporary signage, PPE worn by teams, occupant protection.',
		},
		{
			id: 'H5',
			title: 'Waste management covered',
			status: 'a_clarifier',
			excerpt: 'Waste will be removed regularly to maintain a clean site.',
			explanation:
				'Removal is mentioned, but no reference to sorting, recycling, or specific treatment of old fixtures (WEEE).',
			suggestion:
				'Specify sorting streams (WEEE, cardboard, plastic), removal procedures, and waste tracking documentation.',
		},
		{
			id: 'H6',
			title: 'Required deliverables covered',
			status: 'a_clarifier',
			excerpt: 'The technical data sheets for the proposed light fixtures are attached to our bid.',
			explanation:
				'Only the technical data sheets are cited. The preliminary schedule and environmental note are not mentioned.',
			suggestion:
				'Confirm delivery of all 3 deliverables: preliminary schedule, technical data sheets, and environmental note.',
		},
		{
			id: 'H7',
			title: 'Document too generic',
			status: 'drapeau',
			excerpt:
				'Expertise, diligence, responsiveness, professionalism, experienced teams, careful work, excellent finishing quality.',
			explanation:
				'The document is saturated with generic wording without concrete reference to the specific constraints of the tender. It could apply to any project.',
			suggestion:
				'Rewrite by systematically referencing the constraints: occupied site, deadline, barriers, waste sorting, expected deliverables.',
		},
		{
			id: 'H8',
			title: 'Explicit contradiction',
			status: 'incoherent',
			excerpt:
				'If necessary, some operations may be carried out on weekends to accelerate overall execution.',
			explanation:
				'The document concerns a building occupied on weekdays. Proposing weekend work without justifying compatibility with the imposed framework raises an inconsistency.',
			suggestion:
				'If weekend work is intended to avoid disrupting weekday occupants, explain this clearly.',
		},
	],
	summary: {
		ok: 0,
		aClarifier: 4,
		manquant: 2,
		incoherent: 1,
		genericFlag: true,
		score: 20,
	},
};

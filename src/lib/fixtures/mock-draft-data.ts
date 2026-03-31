import type { DraftData } from '$lib/types';

export const mockDraftData: DraftData = {
	entreprise: {
		nom: 'STE Elec Services',
		adresse: '12 rue des Ateliers — 69003 Lyon',
		email: 'contact@elec-services.fr',
		contact: 'Mr. Durand, Works Manager',
	},
	marche: {
		titre: 'LED Relamping',
		sousTitre: 'Municipal Building — Saint-Fons City Hall',
		date: 'March 2026',
		reference: '2026-COM-0047',
	},
	sections: [
		{
			titre: 'Project understanding',
			contenu:
				'Our company proposes replacing all existing light fixtures with high-performance LED equipment as part of the relamping of the municipal building open to the public. This intervention aims to improve the energy performance of the site and the lighting comfort for occupants, while limiting the impact of the works on the daily activity of the building.',
		},
		{
			titre: 'Schedule and deadline compliance',
			contenu:
				'We commit to completing all works before September 30, 2026, in accordance with the tender requirements.\n\nOur intervention will be organized according to the following phasing:\n\n- Phase 1 — Preparation (2 weeks): survey, equipment ordering, installation plan validation\n- Phase 2 — Works by zone (6 weeks): removal of old fixtures and installation of new equipment, zone by zone\n- Phase 3 — Verification and handover (1 week): lighting tests, performance measurements, deliverable submission\n\nA detailed preliminary schedule will be provided at the start of the preparation phase.',
		},
		{
			titre: 'Occupied-site organization',
			contenu:
				'As the building will remain occupied throughout the works, we will implement the following measures:\n\n- Working by zones: works will be carried out zone by zone, in coordination with the site manager\n- Maintaining circulation: corridors and emergency exits will remain accessible at all times\n- Adapted hours: the noisiest operations will be scheduled outside peak hours\n- Occupant information: clear signage will be posted before each phase',
		},
		{
			titre: 'Site safety',
			contenu:
				'Site safety measures will include:\n\n- Zone barriers and safety tape around work areas, with "works in progress" signage\n- Temporary signage near work zones to guide occupants\n- Mandatory PPE for all on-site personnel: hard hat, gloves, safety glasses, safety boots\n- Occupant protection: installation of protective sheeting, dust extraction at source, daily cleaning',
		},
		{
			titre: 'Waste management',
			contenu:
				'Old light fixtures will be handled in compliance with WEEE regulations:\n\n- On-site sorting: separation of fixtures (WEEE), packaging (cardboard, plastic), and construction waste\n- Regular removal: skip collection at least once per week\n- Approved channels: WEEE will be handed over to an approved eco-organization\n- Traceability: waste tracking forms (BSD) provided at completion',
		},
		{
			titre: 'Deliverables',
			contenu:
				'In accordance with the tender requirements, our bid includes:\n\n- Detailed preliminary intervention schedule showing phases, zones, and durations\n- Technical data sheets for the proposed light fixtures, including luminous performance, power consumption, and lifespan\n- Summary environmental note describing waste management, expected energy savings, and the carbon impact of the project',
		},
	],
};

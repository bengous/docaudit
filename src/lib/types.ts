export type HeuristicStatus = 'ok' | 'a_clarifier' | 'manquant' | 'incoherent' | 'drapeau';

export interface HeuristicResult {
	id: string;
	title: string;
	status: HeuristicStatus;
	excerpt: string;
	explanation: string;
	suggestion: string;
}

export interface AnalysisSummary {
	ok: number;
	aClarifier: number;
	manquant: number;
	incoherent: number;
	genericFlag: boolean;
	score: number;
}

export interface AnalysisResponse {
	heuristics: HeuristicResult[];
	summary: AnalysisSummary;
}

export interface DraftData {
	entreprise: {
		nom: string;
		adresse: string;
		email: string;
		contact: string;
	};
	marche: {
		titre: string;
		sousTitre: string;
		date: string;
		reference: string;
	};
	sections: Array<{
		titre: string;
		contenu: string;
	}>;
}

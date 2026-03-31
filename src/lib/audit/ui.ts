import type { HeuristicStatus } from '$lib/types';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const statusConfig: Record<
	HeuristicStatus,
	{ label: string; bg: string; text: string; textStyle?: string }
> = {
	ok: { label: 'OK', bg: '#E8F5E9', text: 'text-succes' },
	a_clarifier: { label: 'Needs clarification', bg: '#FFF3E0', text: 'text-warning' },
	manquant: { label: 'Missing', bg: '#FFEBEE', text: 'text-erreur' },
	incoherent: { label: 'Inconsistent', bg: '#F3E5F5', text: '', textStyle: 'color: #7B1FA2' },
	drapeau: { label: 'Flag', bg: '#FFF3E0', text: 'text-warning' },
};

export function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

<script lang="ts">
	import type { AnalysisResponse, HeuristicStatus } from '$lib/types';
	import { fly } from 'svelte/transition';
	import HeuristicCard from '$lib/components/audit/HeuristicCard.svelte';

	type StatusConfig = Record<
		HeuristicStatus,
		{ label: string; bg: string; text: string; textStyle?: string }
	>;

	let {
		analysis,
		expandedCards,
		statusConfig,
		onToggleCard,
		onBackToDocument,
	}: {
		analysis: AnalysisResponse;
		expandedCards: Set<string>;
		statusConfig: StatusConfig;
		onToggleCard: (id: string) => void;
		onBackToDocument: () => void;
	} = $props();
</script>

<div in:fly={{ y: 20, duration: 300 }}>
	<button
		onclick={onBackToDocument}
		class="text-action-pressed hover:text-action mb-4 px-4 py-2 text-sm underline underline-offset-3 transition-colors"
	>
		&larr; Back to document
	</button>

	<div class="border-bordure bg-surface mb-8 rounded-lg border p-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex flex-wrap items-center gap-4">
				{#each [{ label: 'OK', count: analysis.summary.ok, bg: '#E8F5E9', text: 'text-succes' }, { label: 'Needs clarification', count: analysis.summary.aClarifier, bg: '#FFF3E0', text: 'text-warning' }, { label: 'Missing', count: analysis.summary.manquant, bg: '#FFEBEE', text: 'text-erreur' }, { label: 'Inconsistent', count: analysis.summary.incoherent, bg: '#F3E5F5', text: '', textStyle: 'color: #7B1FA2' }] as stat (stat.label)}
					<div class="flex items-center gap-2">
						<span class="font-display text-2xl font-bold {stat.text}" style={stat.textStyle ?? ''}>
							{stat.count}
						</span>
						<span
							class="rounded-full px-2 py-0.5 text-xs font-semibold {stat.text}"
							style="background: {stat.bg}; {stat.textStyle ?? ''}"
						>
							{stat.label}
						</span>
					</div>
				{/each}

				{#if analysis.summary.genericFlag}
					<span
						class="text-warning flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
						style="background: #FFF3E0"
					>
						<svg
							class="h-3.5 w-3.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
							<path d="M12 9v4" />
							<path d="M12 17h.01" />
						</svg>
						Document too generic
					</span>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				<span class="text-texte-mute text-sm">Score</span>
				<span
					class="font-display text-4xl font-bold {analysis.summary.score >= 60
						? 'text-succes'
						: analysis.summary.score >= 30
							? 'text-warning'
							: 'text-erreur'}"
				>
					{analysis.summary.score}
				</span>
				<span class="text-texte-mute text-sm">/100</span>
			</div>
		</div>
	</div>

	<div class="space-y-4">
		{#each analysis.heuristics as h (h.id)}
			<HeuristicCard
				heuristic={h}
				expanded={expandedCards.has(h.id)}
				{statusConfig}
				onToggle={onToggleCard}
			/>
		{/each}
	</div>
</div>

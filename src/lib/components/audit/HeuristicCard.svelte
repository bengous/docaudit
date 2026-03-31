<script lang="ts">
	import type { HeuristicResult, HeuristicStatus } from '$lib/types';
	import { fly } from 'svelte/transition';

	type StatusConfig = Record<
		HeuristicStatus,
		{ label: string; bg: string; text: string; textStyle?: string }
	>;

	let {
		heuristic,
		expanded,
		statusConfig,
		onToggle,
	}: {
		heuristic: HeuristicResult;
		expanded: boolean;
		statusConfig: StatusConfig;
		onToggle: (id: string) => void;
	} = $props();

	const config = $derived(statusConfig[heuristic.status]);
</script>

<div class="border-bordure bg-surface overflow-hidden rounded-lg border">
	<button
		onclick={() => onToggle(heuristic.id)}
		class="hover:bg-fond-alt flex w-full items-start gap-4 px-5 py-4 text-left transition-colors"
	>
		<span
			class="mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold {config.text}"
			style="background: {config.bg}; {config.textStyle ?? ''}"
		>
			{config.label}
		</span>
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<span class="text-texte-mute font-mono text-xs">{heuristic.id}</span>
				<h3 class="text-texte font-medium">{heuristic.title}</h3>
			</div>
			<p class="text-texte-mute mt-1 line-clamp-1 text-sm">{heuristic.explanation}</p>
		</div>
		<svg
			class="text-texte-mute h-5 w-5 shrink-0 transition-transform {expanded ? 'rotate-180' : ''}"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	</button>

	{#if expanded}
		<div class="border-bordure border-t px-5 pb-4" transition:fly={{ y: -10, duration: 200 }}>
			{#if heuristic.excerpt}
				<div class="mt-4">
					<span class="text-texte-mute text-xs font-semibold tracking-wider uppercase">
						Document excerpt
					</span>
					<p class="bg-fond text-texte mt-2 rounded-md p-4 text-sm italic">{heuristic.excerpt}</p>
				</div>
			{/if}
			{#if heuristic.suggestion}
				<div class="mt-4">
					<span class="text-texte-mute text-xs font-semibold tracking-wider uppercase">
						Suggestion
					</span>
					<p
						class="text-action-pressed mt-2 rounded-md p-4 text-sm"
						style="background: rgba(196, 88, 36, 0.06)"
					>
						{heuristic.suggestion}
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<script lang="ts">
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';

	let {
		step,
		model,
		mockMode,
		loading,
		pdfUrl,
		onToggleModel,
		onToggleMock,
		onReset,
	}: {
		step: number;
		model: 'sonnet' | 'haiku';
		mockMode: boolean;
		loading: boolean;
		pdfUrl: string | null;
		onToggleModel: () => void;
		onToggleMock: () => void;
		onReset: () => void;
	} = $props();
</script>

<header class="border-bordure bg-surface sticky top-0 z-100 border-b">
	<div class="mx-auto max-w-5xl px-6 py-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h1 class="font-display text-texte text-xl font-bold">DocAudit</h1>
				{#if step > 1}
					<button
						onclick={onReset}
						class="text-texte-mute hover:text-action rounded-md p-1.5 transition-colors"
						title="New audit"
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
							<path d="M21 3v5h-5" />
							<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
							<path d="M8 16H3v5" />
						</svg>
					</button>
				{/if}
			</div>
			{#if step <= 2}
				<div class="flex items-center gap-3">
					{#if !mockMode}
						<SegmentedControl
							options={[
								{ value: 'sonnet', label: 'Sonnet' },
								{ value: 'haiku', label: 'Haiku' },
							]}
							value={model}
							disabled={loading}
							onchange={onToggleModel}
						/>
					{/if}
					<SegmentedControl
						options={[
							{ value: 'mock', label: 'Mock' },
							{ value: 'live', label: 'Live' },
						]}
						value={mockMode ? 'mock' : 'live'}
						disabled={loading}
						onchange={onToggleMock}
					/>
				</div>
			{:else if step === 3 && pdfUrl}
				<button
					onclick={() => {
						const a = document.createElement('a');
						a.href = pdfUrl;
						a.download = 'improved-technical-response.pdf';
						a.click();
					}}
					class="border-action text-action hover:bg-action flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors hover:text-white"
				>
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" x2="12" y1="15" y2="3" />
					</svg>
					Download PDF
				</button>
			{/if}
		</div>
	</div>
</header>

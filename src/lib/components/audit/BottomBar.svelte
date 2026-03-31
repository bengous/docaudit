<script lang="ts">
	let {
		step,
		loading,
		maxReachedStep,
		canProceed,
		onAction,
		onGoToStep,
	}: {
		step: number;
		loading: boolean;
		maxReachedStep: number;
		canProceed: boolean;
		onAction: () => void;
		onGoToStep: (step: number) => void;
	} = $props();

	const steps = [
		{ n: 1, label: 'Document' },
		{ n: 2, label: 'Audit' },
		{ n: 3, label: 'Results' },
	];

	const ctaLabels: Record<number, { idle: string; loading: string }> = {
		1: { idle: 'Run audit', loading: 'Analyzing...' },
		2: { idle: 'Generate improved version', loading: 'Generating...' },
		3: { idle: 'New audit', loading: '' },
	};

	let ctaText = $derived(loading ? ctaLabels[step].loading : ctaLabels[step].idle);
	let ctaDisabled = $derived(loading || (!canProceed && step === 1));
</script>

<div class="border-bordure bg-surface sticky bottom-0 z-100 border-t">
	<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
		<div class="flex items-center gap-2">
			{#each steps as s (s.n)}
				{#if s.n > 1}
					<div class="h-px w-6 {maxReachedStep >= s.n ? 'bg-action' : 'bg-bordure'}"></div>
				{/if}
				{@const reachable = s.n <= maxReachedStep && s.n !== step}
				<button
					type="button"
					class="flex items-center gap-1.5"
					disabled={!reachable}
					onclick={() => {
						if (reachable) onGoToStep(s.n);
					}}
				>
					<div
						class="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors
						{s.n <= maxReachedStep ? 'bg-action text-white' : 'bg-bordure text-texte-mute'}
						{reachable ? 'cursor-pointer hover:opacity-80' : ''}"
					>
						{#if s.n !== step && s.n <= maxReachedStep}
							<svg
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
						{:else}
							{s.n}
						{/if}
					</div>
					<span
						class="hidden text-sm sm:inline {s.n <= maxReachedStep
							? 'text-texte'
							: 'text-structure-mute'}
						{reachable ? 'cursor-pointer' : ''}"
					>
						{s.label}
					</span>
				</button>
			{/each}
		</div>

		<button
			onclick={onAction}
			disabled={ctaDisabled}
			class="bg-action hover:bg-action-hover active:bg-action-pressed flex min-h-11 items-center gap-2 rounded-md px-6 py-2.5 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if loading}
				<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
						fill="none"
					/>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					/>
				</svg>
			{/if}
			{ctaText}
		</button>
	</div>
</div>

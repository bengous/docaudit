<script lang="ts">
	import { fly } from 'svelte/transition';
	import { formatFileSize } from '$lib/audit/ui';

	let {
		file,
		loading,
		onSelectFile,
	}: {
		file: File | null;
		loading: boolean;
		onSelectFile: (file: File) => void;
	} = $props();

	let dragging = $state(false);
	let fileInputEl = $state<HTMLInputElement | null>(null);

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const dropped = e.dataTransfer?.files[0];
		if (dropped) onSelectFile(dropped);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		if (
			e.currentTarget instanceof HTMLElement &&
			!e.currentTarget.contains(e.relatedTarget as Node)
		) {
			dragging = false;
		}
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const selected = input.files?.[0];
		if (selected) onSelectFile(selected);
		input.value = '';
	}

	function openFileInput() {
		fileInputEl?.click();
	}
</script>

<div in:fly={{ y: 20, duration: 300 }}>
	<input
		type="file"
		accept=".pdf"
		class="hidden"
		bind:this={fileInputEl}
		onchange={handleFileInput}
	/>

	{#if !file}
		<button
			type="button"
			class="flex min-h-80 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors
			{dragging ? 'border-action' : 'border-bordure bg-surface hover:border-structure-mute'}"
			style={dragging ? 'background: rgba(196, 88, 36, 0.04)' : ''}
			onclick={openFileInput}
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragenter={handleDragEnter}
			ondragleave={handleDragLeave}
		>
			<svg
				class="mb-4 h-8 w-8 transition-colors {dragging ? 'text-action' : 'text-structure'}"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="17 8 12 3 7 8" />
				<line x1="12" x2="12" y1="3" y2="15" />
			</svg>
			<span
				class="font-display text-lg font-semibold transition-colors {dragging
					? 'text-action'
					: 'text-texte'}"
			>
				Drop your technical proposal
			</span>
			<span class="text-texte-mute mt-1 text-sm"> PDF — 10 MB max </span>
		</button>
	{:else}
		<div class="border-bordure bg-surface rounded-lg border p-6">
			<div class="flex items-center gap-3">
				<svg
					class="text-action h-5 w-5 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
					<path d="M14 2v4a2 2 0 0 0 2 2h4" />
					<path d="M10 9H8" />
					<path d="M16 13H8" />
					<path d="M16 17H8" />
				</svg>
				<div class="min-w-0 flex-1">
					<p class="text-texte truncate font-medium">{file.name}</p>
					<p class="text-texte-mute text-sm">{formatFileSize(file.size)}</p>
				</div>
			</div>
			<div class="mt-6 flex items-center justify-end">
				<button
					onclick={openFileInput}
					disabled={loading}
					class="border-action text-action hover:bg-action min-h-11 rounded-md border px-4 py-2 text-sm font-semibold transition-colors hover:text-white disabled:opacity-50"
				>
					Change file
				</button>
			</div>
		</div>
	{/if}
</div>

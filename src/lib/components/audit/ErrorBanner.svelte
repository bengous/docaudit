<script lang="ts">
	import { fade } from 'svelte/transition';

	let { error }: { error: string } = $props();
</script>

{#if error}
	<div
		class="border-erreur/30 bg-erreur/5 text-erreur mb-6 flex items-center gap-2 rounded-md border p-4 text-sm"
		transition:fade
	>
		<svg
			class="h-4 w-4 shrink-0"
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
		{error}
	</div>
{/if}

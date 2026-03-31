<script lang="ts">
	import { fly } from 'svelte/transition';

	let {
		pdfUrl,
		onBackToAudit,
	}: {
		pdfUrl: string;
		onBackToAudit: () => void;
	} = $props();
</script>

<div in:fly={{ y: 20, duration: 300 }}>
	<button
		onclick={onBackToAudit}
		class="text-action-pressed hover:text-action mb-4 px-4 py-2 text-sm underline underline-offset-3 transition-colors"
	>
		&larr; Back to audit
	</button>

	<h2 class="font-display text-texte mb-6 text-2xl font-semibold">Improved version</h2>

	<iframe
		src={pdfUrl}
		title="Improved version (PDF)"
		class="border-bordure h-[80vh] w-full rounded-lg border"
	></iframe>
</div>

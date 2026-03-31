<script lang="ts">
	import AuditHeader from '$lib/components/audit/AuditHeader.svelte';
	import BottomBar from '$lib/components/audit/BottomBar.svelte';
	import DraftStep from '$lib/components/audit/DraftStep.svelte';
	import ErrorBanner from '$lib/components/audit/ErrorBanner.svelte';
	import ResultsStep from '$lib/components/audit/ResultsStep.svelte';
	import UploadStep from '$lib/components/audit/UploadStep.svelte';
	import { statusConfig } from '$lib/audit/ui';
	import {
		analyzeDocument,
		generateImprovedDraft,
		toggleExpandedCard,
		validatePdfFile,
	} from '$lib/audit/workflow';
	import type { AnalysisResponse } from '$lib/types';

	let { data } = $props();

	let step = $state(1);
	let file = $state<File | null>(null);
	let analysis = $state<AnalysisResponse | null>(null);
	let sessionId = $state('');
	let pdfUrl = $state<string | null>(null);
	let loading = $state(false);
	let error = $state('');
	let expandedCards = $state<Set<string>>(new Set());
	let model = $state<'sonnet' | 'haiku'>('haiku');
	let mockMode = $state(data?.defaultMockMode ?? true);
	let errorTimeout = $state<ReturnType<typeof setTimeout> | null>(null);

	function setError(msg: string) {
		if (errorTimeout) clearTimeout(errorTimeout);
		error = msg;
		errorTimeout = setTimeout(() => {
			error = '';
			errorTimeout = null;
		}, 5000);
	}

	function handleFileSelection(f: File) {
		const validation = validatePdfFile(f);
		if (!validation.ok) {
			setError(validation.error);
			return;
		}
		error = '';
		file = f;
	}

	async function audit() {
		if (!file) return;
		loading = true;
		error = '';
		try {
			const result = await analyzeDocument(file, model, mockMode);
			sessionId = result.sessionId;
			analysis = result.analysis;
			step = 2;
		} catch (e) {
			setError(
				e instanceof Error ? e.message : 'Analysis failed. Check your connection and try again.',
			);
		} finally {
			loading = false;
		}
	}

	async function generateDraft() {
		loading = true;
		error = '';
		try {
			const blob = await generateImprovedDraft(sessionId, model, mockMode);
			pdfUrl = URL.createObjectURL(blob);
			step = 3;
		} catch (e) {
			setError(
				e instanceof Error ? e.message : 'Generation failed. Check your connection and try again.',
			);
		} finally {
			loading = false;
		}
	}

	function reset() {
		step = 1;
		file = null;
		analysis = null;
		sessionId = '';
		if (pdfUrl) URL.revokeObjectURL(pdfUrl);
		pdfUrl = null;
		error = '';
		expandedCards = new Set();
	}

	function toggleCard(id: string) {
		expandedCards = toggleExpandedCard(expandedCards, id);
	}
</script>

<div class="bg-fond min-h-screen">
	<AuditHeader
		{step}
		{model}
		{mockMode}
		{loading}
		{pdfUrl}
		onToggleModel={() => (model = model === 'sonnet' ? 'haiku' : 'sonnet')}
		onToggleMock={() => (mockMode = !mockMode)}
		onReset={reset}
	/>

	<main class="mx-auto max-w-5xl px-6 py-8 pb-20">
		<ErrorBanner {error} />

		{#if step === 1}
			<UploadStep {file} {loading} onSelectFile={handleFileSelection} />
		{/if}

		{#if step === 2 && analysis}
			<ResultsStep
				{analysis}
				{expandedCards}
				{statusConfig}
				onToggleCard={toggleCard}
				onBackToDocument={() => (step = 1)}
			/>
		{/if}

		{#if step === 3 && pdfUrl}
			<DraftStep {pdfUrl} onBackToAudit={() => (step = 2)} />
		{/if}
	</main>

	<BottomBar
		{step}
		{loading}
		maxReachedStep={pdfUrl ? 3 : analysis ? 2 : 1}
		canProceed={step === 1 ? file !== null : true}
		onAction={step === 1 ? audit : step === 2 ? generateDraft : reset}
		onGoToStep={(s) => (step = s)}
	/>
</div>

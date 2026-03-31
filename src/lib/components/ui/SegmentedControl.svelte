<script lang="ts">
	type Option = { value: string; label: string };

	let {
		options,
		value,
		disabled = false,
		onchange,
	}: {
		options: [Option, Option];
		value: string;
		disabled?: boolean;
		onchange: () => void;
	} = $props();

	let activeIndex = $derived(options.findIndex((o) => o.value === value));
</script>

<div
	class="bg-fond-alt relative grid w-fit grid-cols-2 rounded-full p-0.5 {disabled
		? 'pointer-events-none opacity-50'
		: ''}"
>
	<span
		class="bg-action absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full shadow-sm transition-[left] duration-200 ease-out"
		style="left: {activeIndex === 0 ? '2px' : '50%'}"
	></span>

	{#each options as option, i}
		<button
			type="button"
			onclick={i !== activeIndex ? onchange : undefined}
			class="relative z-10 w-full cursor-pointer rounded-full px-4 py-1 text-center text-xs font-semibold transition-colors duration-200
				{i === activeIndex ? 'text-white' : 'text-texte-mute hover:text-texte'}"
			{disabled}
		>
			{option.label}
		</button>
	{/each}
</div>

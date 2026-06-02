<script lang="ts">
	type Option = { value: string; label: string };

	let {
		options,
		value,
		disabled = false,
		onchange,
	}: {
		options: Option[];
		value: string;
		disabled?: boolean;
		onchange: (value: string) => void;
	} = $props();

	let activeIndex = $derived(
		Math.max(
			0,
			options.findIndex((o) => o.value === value),
		),
	);
	let optionCount = $derived(Math.max(1, options.length));
	let indicatorStyle = $derived(
		`width: calc((100% - 4px) / ${optionCount}); left: calc(2px + ${activeIndex} * ((100% - 4px) / ${optionCount}));`,
	);
	let gridStyle = $derived(`grid-template-columns: repeat(${optionCount}, minmax(0, 1fr));`);
</script>

<div
	class="bg-fond-alt relative grid w-fit rounded-full p-0.5 {disabled
		? 'pointer-events-none opacity-50'
		: ''}"
	style={gridStyle}
>
	<span
		class="bg-action absolute top-0.5 bottom-0.5 rounded-full shadow-sm transition-[left,width] duration-200 ease-out"
		style={indicatorStyle}
	></span>

	{#each options as option, i (option.value)}
		<button
			type="button"
			onclick={i !== activeIndex ? () => onchange(option.value) : undefined}
			class="relative z-10 w-full cursor-pointer rounded-full px-4 py-1 text-center text-xs font-semibold transition-colors duration-200
				{i === activeIndex ? 'text-white' : 'text-texte-mute hover:text-texte'}"
			{disabled}
		>
			{option.label}
		</button>
	{/each}
</div>

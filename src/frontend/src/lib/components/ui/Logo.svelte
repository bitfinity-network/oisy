<script lang="ts">
	import { isNullish, nonNullish } from '@dfinity/utils';
	import IconRandom from '$lib/components/icons/IconRandom.svelte';
	import Img from '$lib/components/ui/Img.svelte';
	import type { LogoSize } from '$lib/types/components';

	export let src: string | undefined;
	export let alt = '';
	export let size: LogoSize = 'xs';
	export let color: 'dust' | 'off-white' | 'white' = 'dust';
	export let ring = false;
	export let testId: string | undefined = undefined;

	const sizes = {
		xs: '22px',
		sm: '36px',
		md: '42px',
		lg: '52px',
		xl: '64px'
	};
	let sizePx = sizes[size];

	let loaded = false;

	$: src,
		(() => {
			loaded = isNullish(src);
			loadingError = false;
		})();

	let loadingError = false;
	const onError = () => {
		loadingError = true;
		loaded = true;
	};
</script>

<div
	class="flex items-center justify-center overflow-hidden rounded-full ring-white"
	class:bg-dust={color === 'dust' && !loaded}
	class:bg-off-white={color === 'off-white' && !loaded}
	class:bg-white={color === 'white' && !loaded}
	class:opacity-10={!loaded}
	class:ring-2={ring}
	style={`width: ${sizePx}; height: ${sizePx}; transition: opacity 0.15s ease-in;`}
	data-tid={testId}
>
	{#if nonNullish(src) && !loadingError}
		<Img
			{src}
			{alt}
			fitHeight
			height={sizePx}
			on:load={() => (loaded = true)}
			on:error={onError}
			rounded
		/>
	{:else}
		<IconRandom size={sizePx} text={alt} />
	{/if}
</div>

<script lang="ts">
	import preview from '$lib/assets/preview.webp';
	import HeroSignIn from '$lib/components/hero/HeroSignIn.svelte';
	import Img from '$lib/components/ui/Img.svelte';
	import { i18n } from '$lib/stores/i18n.store';
	import { replaceOisyPlaceholders } from '$lib/utils/i18n.utils';

	let ariaLabel: string;
	$: ariaLabel = replaceOisyPlaceholders($i18n.auth.alt.preview);
</script>

<div
	class="m-auto h-full min-h-96 w-full max-w-screen-2.5xl items-start gap-12 px-5 md:grid md:grid-cols-2 md:grid-rows-1 md:gap-8 md:overflow-visible"
>
	<div class="w-full content-center md:h-full md:flex-1 md:pl-8 md:pt-12">
		<HeroSignIn />
	</div>

	<!-- TODO: determine if this value is specific/permanent or can be changed -->
	<div
		class="ml-auto min-w-[1127px] pt-12 md:m-0 md:flex md:h-full md:content-center md:items-center"
	>
		<div class="w-full md:h-md:mt-auto">
			<Img src={preview} alt={ariaLabel} />
		</div>
	</div>
</div>

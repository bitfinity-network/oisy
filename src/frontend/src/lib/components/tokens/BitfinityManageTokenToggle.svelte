<script lang="ts">
	import { Toggle } from '@dfinity/gix-components';
	import { createEventDispatcher } from 'svelte';
	import type { RequiredTokenWithLinkedData } from '$lib/types/token';
	import type { TokenToggleable } from '$lib/types/token-toggleable';
	import { i18n } from '$lib/stores/i18n.store';

	export let token: TokenToggleable<RequiredTokenWithLinkedData>;
	export let checked: boolean;

	const dispatch = createEventDispatcher();

	const toggle = () => {
		dispatch('icShowOrHideToken', {
			...token,
			enabled: !checked,
			version: undefined,
			standard: 'ethereum',
			category: 'default'
		} as TokenToggleable<RequiredTokenWithLinkedData>);
	};
</script>

<Toggle
	ariaLabel={checked ? $i18n.tokens.text.hide_token : $i18n.tokens.text.show_token}
	bind:checked
	on:nnsToggle={toggle}
/>

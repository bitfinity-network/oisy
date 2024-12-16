<script lang="ts">
	import { Toggle } from '@dfinity/gix-components';
	import { createEventDispatcher } from 'svelte';
	import type { RequiredTokenWithLinkedData } from '$lib/types/token';
	import type { TokenToggleable } from '$lib/types/token-toggleable';
	import { i18n } from '$lib/stores/i18n.store';

	export let token: RequiredTokenWithLinkedData & TokenToggleable<RequiredTokenWithLinkedData>;

	let checked: boolean;
	$: checked = token.enabled ?? false;

	const dispatch = createEventDispatcher();

	const toggle = () => {
		const newState = !token.enabled;
		dispatch('icShowOrHideToken', {
			...token,
			enabled: newState,
			version: undefined,
			standard: 'ethereum'
		});
	};
</script>

<Toggle
	ariaLabel={checked ? $i18n.tokens.text.hide_token : $i18n.tokens.text.show_token}
	checked={token.enabled ?? false}
	on:nnsToggle={toggle}
/> 
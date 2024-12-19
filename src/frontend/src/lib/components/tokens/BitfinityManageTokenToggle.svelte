<script lang="ts">
	import { Toggle } from '@dfinity/gix-components';
	import { createEventDispatcher, onMount } from 'svelte';
	import type { RequiredTokenWithLinkedData } from '$lib/types/token';
	import type { TokenToggleable } from '$lib/types/token-toggleable';
	import { i18n } from '$lib/stores/i18n.store';

	export let token: RequiredTokenWithLinkedData;
	export let checked = false;

	const dispatch = createEventDispatcher();

	onMount(() => {
		const savedStates = localStorage.getItem('bitfinity-token-states');
		if (savedStates) {
			const states = JSON.parse(savedStates);
			if (states[token.symbol] !== undefined) {
				checked = states[token.symbol];
			}
		}
	});

	const toggle = () => {
		checked = !checked;
		dispatch('icShowOrHideToken', {
			...token,
			enabled: checked,
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

<script lang="ts">
	import { slide } from 'svelte/transition';
	import MultipleListeners from '$lib/components/core/MultipleListeners.svelte';
	import TokenCardContent from '$lib/components/tokens/TokenCardContent.svelte';
	import TokenCardWithOnClick from '$lib/components/tokens/TokenCardWithOnClick.svelte';
	import TokenCardWithUrl from '$lib/components/tokens/TokenCardWithUrl.svelte';
	import { TOKEN_GROUP } from '$lib/constants/test-ids.constants';
	import { SLIDE_PARAMS } from '$lib/constants/transition.constants';
	import { tokenGroupStore } from '$lib/stores/token-group.store';
	import type { CardData } from '$lib/types/token-card';
	import type { TokenUiGroup } from '$lib/types/token-group';
	import { mapHeaderData } from '$lib/utils/token-card.utils';

	export let tokenGroup: TokenUiGroup;

	let isExpanded: boolean;
	$: isExpanded = ($tokenGroupStore ?? {})[tokenGroup.id]?.isExpanded ?? false;

	let headerData: CardData;
	$: headerData = mapHeaderData(tokenGroup);

	const toggleIsExpanded = (toggle: boolean) =>
		tokenGroupStore.set({ tokenId: tokenGroup.id, data: { isExpanded: toggle } });
</script>

<div class="flex flex-col">
	<MultipleListeners tokens={tokenGroup.tokens}>
		<TokenCardWithOnClick
			on:click={() => toggleIsExpanded(!isExpanded)}
			styleClass="rounded-xl px-3 py-2 hover:bg-white active:bg-white {isExpanded
				? 'bg-white rounded-b-none'
				: ''}"
		>
			<TokenCardContent data={headerData} hideNetworkLogo testIdPrefix={TOKEN_GROUP} />
		</TokenCardWithOnClick>
	</MultipleListeners>

	{#if isExpanded}
		<div class="flex flex-col gap-3 rounded-b-xl bg-white/40 pt-2" transition:slide={SLIDE_PARAMS}>
			{#each tokenGroup.tokens as token, index (`${token.network.id.description}-${token.id.description}-${token.symbol}-${index}`)}
				<TokenCardWithUrl {token}>
					<TokenCardContent logoSize="md" data={token} />
				</TokenCardWithUrl>
			{/each}
		</div>
	{/if}
</div>

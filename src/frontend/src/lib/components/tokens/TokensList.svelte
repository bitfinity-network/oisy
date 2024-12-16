<script lang="ts">
	import { debounce, isNullish } from '@dfinity/utils';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { erc20UserTokensNotInitialized } from '$eth/derived/erc20.derived';
	import Listener from '$lib/components/core/Listener.svelte';
	import ManageTokensModal from '$lib/components/manage/ManageTokensModal.svelte';
	import NoTokensPlaceholder from '$lib/components/tokens/NoTokensPlaceholder.svelte';
	import TokenCardContent from '$lib/components/tokens/TokenCardContent.svelte';
	import TokenCardWithUrl from '$lib/components/tokens/TokenCardWithUrl.svelte';
	import TokenGroupCard from '$lib/components/tokens/TokenGroupCard.svelte';
	import TokensDisplayHandler from '$lib/components/tokens/TokensDisplayHandler.svelte';
	import TokensSkeletons from '$lib/components/tokens/TokensSkeletons.svelte';
	import { modalManageTokens } from '$lib/derived/modal.derived';
	import { tokenGroups } from '$lib/stores/token-groups.store';
	import type { TokenUiOrGroupUi } from '$lib/types/token-group';
	import { isTokenUiGroup } from '$lib/utils/token-group.utils';

	let tokens: TokenUiOrGroupUi[] | undefined;
	let animating = false;

	const handleAnimationStart = () => {
		animating = true;
		debouncedHandleAnimationEnd();
	};

	const handleAnimationEnd = () => (animating = false);

	const debouncedHandleAnimationEnd = debounce(() => {
		if (animating) {
			handleAnimationEnd();
		}
	}, 250);

	let loading: boolean;
	$: loading = $erc20UserTokensNotInitialized || isNullish(tokens);
</script>

<TokensDisplayHandler bind:tokens>
	<TokensSkeletons {loading}>
		<div class="mb-3 flex flex-col gap-6">
			{#if $tokenGroups.bridgeTokens.ckERC20.length > 0}
				<div class="flex flex-col gap-3">
					<h3 class="text-sm font-medium text-gray-500">Bridge Tokens</h3>
					{#each $tokenGroups.bridgeTokens.ckERC20 as token, i (token.id)}
						<div
							transition:fade
							animate:flip={{ duration: 250 }}
							on:animationstart={handleAnimationStart}
							on:animationend={handleAnimationEnd}
							class:pointer-events-none={animating}
						>
							{#if isTokenUiGroup(token)}
								<TokenGroupCard tokenGroup={token} />
							{:else}
								<Listener {token}>
									<TokenCardWithUrl {token}>
										<TokenCardContent data={token} />
									</TokenCardWithUrl>
								</Listener>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			{#if $tokenGroups.nonBridgeTokens.native.length > 0 || $tokenGroups.nonBridgeTokens.sns.length > 0}
				<div class="flex flex-col gap-3">
					<h3 class="text-sm font-medium text-gray-500">Non-Bridge Tokens</h3>
					
					{#each $tokenGroups.nonBridgeTokens.native as token, i (token.id)}
						<div
							transition:fade
							animate:flip={{ duration: 250 }}
							on:animationstart={handleAnimationStart}
							on:animationend={handleAnimationEnd}
							class:pointer-events-none={animating}
						>
							{#if isTokenUiGroup(token)}
								<TokenGroupCard tokenGroup={token} />
							{:else}
								<Listener {token}>
									<TokenCardWithUrl {token}>
										<TokenCardContent data={token} />
									</TokenCardWithUrl>
								</Listener>
							{/if}
						</div>
					{/each}

					{#each $tokenGroups.nonBridgeTokens.sns as token, i (token.id)}
						<div
							transition:fade
							animate:flip={{ duration: 250 }}
							on:animationstart={handleAnimationStart}
							on:animationend={handleAnimationEnd}
							class:pointer-events-none={animating}
						>
							{#if isTokenUiGroup(token)}
								<TokenGroupCard tokenGroup={token} />
							{:else}
								<Listener {token}>
									<TokenCardWithUrl {token}>
										<TokenCardContent data={token} />
									</TokenCardWithUrl>
								</Listener>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{#if tokens?.length === 0}
			<NoTokensPlaceholder />
		{/if}

		{#if $modalManageTokens}
			<ManageTokensModal />
		{/if}
	</TokensSkeletons>
</TokensDisplayHandler>

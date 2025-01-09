<script lang="ts">
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { getContext } from 'svelte';
	import { erc20UserTokens } from '$eth/derived/erc20.derived';
	import { icrcTokens } from '$icp/derived/icrc.derived';
	import CkEthLoader from '$icp-eth/components/core/CkEthLoader.svelte';
	import { autoLoadCustomToken } from '$icp-eth/services/custom-token.services';
	import { autoLoadUserToken } from '$icp-eth/services/user-token.services';
	import { ckEthMinterInfoStore } from '$icp-eth/stores/cketh.store';
	import { toCkEthHelperContractAddress } from '$icp-eth/utils/cketh.utils';
	import ButtonHero from '$lib/components/hero/ButtonHero.svelte';
	import { ethAddressNotLoaded } from '$lib/derived/address.derived';
	import { authIdentity } from '$lib/derived/auth.derived';
	import { isBusy } from '$lib/derived/busy.derived';
	import { networkICP } from '$lib/derived/network.derived';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import { modalSend, modalConvertToTwinToken } from '$lib/derived/modal.derived';
	import { waitWalletReady } from '$lib/services/actions.services';
	import { HERO_CONTEXT_KEY, type HeroContext } from '$lib/stores/hero.store';
	import { modalStore } from '$lib/stores/modal.store';
	import type { NetworkId } from '$lib/types/network';
	import type { TokenId, TokenUi } from '$lib/types/token';
	import { BigNumber } from '@ethersproject/bignumber';
	import BTFSendTokenModal from './BTFSendTokenModal.svelte';
	import { ICP_NETWORK } from '$env/networks.env';

	export let nativeTokenId: TokenId;
	export let ariaLabel: string;
	export let nativeNetworkId: NetworkId;

	const { outflowActionsDisabled } = getContext<HeroContext>(HERO_CONTEXT_KEY);

	$: token = $tokenWithFallback as TokenUi;
	$: isBitfinityToken = nonNullish(token) && token.twinTokenSymbol?.startsWith('o');

	$: helperContractAddress = toCkEthHelperContractAddress({
		minterInfo: $ckEthMinterInfoStore?.[nativeTokenId],
		networkId: nativeNetworkId
	});

	const isDisabled = (): boolean => {
		// For Bitfinity tokens, we check if the Ethereum address is loaded and if there's a balance
		if (isBitfinityToken) {
			return $ethAddressNotLoaded;
		}

		// For other tokens, we keep the original checks
		return (
			$ethAddressNotLoaded ||
			isNullish(helperContractAddress) ||
			($networkICP && isNullish($ckEthMinterInfoStore?.[nativeTokenId]))
		);
	};

	const openSend = async () => {
		if (isDisabled()) {
			const status = await waitWalletReady(isDisabled);

			if (status === 'timeout') {
				return;
			}
		}

		modalStore.openConvertToTwinToken();
	};
</script>

<CkEthLoader {nativeTokenId}>
	<ButtonHero
		on:click={async () => await openSend()}
		disabled={isDisabled() || $isBusy || $outflowActionsDisabled}
		{ariaLabel}
	>
		<slot name="icon" slot="icon" />
		<slot />
	</ButtonHero>
</CkEthLoader>

{#if $modalSend}
	<BTFSendTokenModal destination={helperContractAddress ?? ''} targetNetwork={token.network} />
{/if}

{#if $modalConvertToTwinToken}
	<BTFSendTokenModal destination={helperContractAddress ?? ''} targetNetwork={token.network} />
{/if}

<script lang="ts">
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { getContext, setContext } from 'svelte';
	import ButtonHero from '$lib/components/hero/ButtonHero.svelte';
	import { ethAddressNotLoaded } from '$lib/derived/address.derived';
	import { isBusy } from '$lib/derived/busy.derived';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import { modalConvertToTwinToken } from '$lib/derived/modal.derived';
	import { waitWalletReady } from '$lib/services/actions.services';
	import { HERO_CONTEXT_KEY, type HeroContext } from '$lib/stores/hero.store';
	import { modalStore } from '$lib/stores/modal.store';
	import type { NetworkId } from '$lib/types/network';
	import type { TokenId, TokenUi } from '$lib/types/token';
	import BTFSendTokenModal from './BTFSendTokenModal.svelte';
	import { BITFINITY_NETWORK, BITFINITY_NETWORK_ID } from '$env/networks.env';
	import { initSendContext, SEND_CONTEXT_KEY, type SendContext } from '$lib/stores/send.store';
	import { getAgent } from '$lib/actors/agents.ic';
	import { authIdentity } from '$lib/derived/auth.derived';
	import { jsonRpcProviders } from '$eth/providers/jsonrpc.provider';
	import { JsonRpcProvider } from '@ethersproject/providers';
	import { ChainID, ChainName, ChainState, ChainType, IcBitfinityBridge, ServiceType } from '../bridge';


	export let ariaLabel: string;

	const { outflowActionsDisabled } = getContext<HeroContext>(HERO_CONTEXT_KEY);

	$: token = $tokenWithFallback as TokenUi;
	$: isBitfinityTwinToken = nonNullish(token) && token.twinTokenSymbol?.startsWith('o');

	/**
	 * Send context store
	 */
	$: if (token) {
		const context = initSendContext({
			sendPurpose: 'convert-to-twin-token',
			token
		});
		setContext<SendContext>(SEND_CONTEXT_KEY, context);
	}

	const isDisabled = (): boolean => {
		return $ethAddressNotLoaded;
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


	const bridgeTest = async () => {
	
		if(!$authIdentity) return;
		const agent = await getAgent({ identity: $authIdentity });
		const provider =  jsonRpcProviders(BITFINITY_NETWORK_ID);
		const chain = {
			chainId: 355110,
			chainName: ChainName.Bitfinity,
			canisterId: "pw3ee-pyaaa-aaaar-qahva-cai", 
			feeToken: [],
			chainType: ChainType.ExecutionChain,
			counterparties: [],
			chainState: ChainState.Active,
			serviceType: ServiceType.Route,
			contractAddress: "0x1Ad8cec9E5a4A441FE407785E188AbDeb4371468", 
			evmChain: {
				chainId: 35513,
				chainName: ChainName.Bitfinity,
				nativeCurrency: {
					symbol: "BTF",
					decimals: 18
				}
			}
		};
		const bridge = new IcBitfinityBridge(chain, agent, provider);
		console.log("bridge", bridge);
		try {
			const txHash = await bridge.bridgeToEvm({
			tokenId: "2ouva-viaaa-aaaaq-aaamq-cai",
			targetEvmAddress: "0xf975d746F36a1473A1055c262155F3c7f2bd9278",
			identity: $authIdentity,
			amount: BigInt("10000000")
			})
		console.log("txHash", txHash);

		} catch (error) {
			console.error("error--", error);
		}
		
	}
</script>

<ButtonHero
	on:click={async () =>  bridgeTest()}
	disabled={isDisabled() || $isBusy || $outflowActionsDisabled}
	{ariaLabel}
>
	<slot name="icon" slot="icon" />
	<slot />
</ButtonHero>

{#if $modalConvertToTwinToken}
	<BTFSendTokenModal
		{isBitfinityTwinToken}
		destination={isBitfinityTwinToken
			? token.network.id.toString()
			: BITFINITY_NETWORK.id.toString()}
		targetNetwork={isBitfinityTwinToken ? BITFINITY_NETWORK : token.network}
	/>
{/if}

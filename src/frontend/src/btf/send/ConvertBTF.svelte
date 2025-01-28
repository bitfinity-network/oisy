<script lang="ts">
	import { nonNullish } from '@dfinity/utils';
	import { getContext, setContext } from 'svelte';
	import ButtonHero from '$lib/components/hero/ButtonHero.svelte';
	import { ethAddressNotLoaded } from '$lib/derived/address.derived';
	import { isBusy } from '$lib/derived/busy.derived';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import { modalConvertToTwinToken } from '$lib/derived/modal.derived';
	import { waitWalletReady } from '$lib/services/actions.services';
	import { HERO_CONTEXT_KEY, type HeroContext } from '$lib/stores/hero.store';
	import { modalStore } from '$lib/stores/modal.store';
	import { authIdentity } from '$lib/derived/auth.derived';
	
	import type { TokenUi } from '$lib/types/token';
	import BTFSendTokenModal from './BTFSendTokenModal.svelte';
	import { BITFINITY_NETWORK, BITFINITY_NETWORK_ID } from '$env/networks.env';
	import { initSendContext, SEND_CONTEXT_KEY, type SendContext } from '$lib/stores/send.store';
	import { ChainID, type Chain } from '../bridge';
	import { BitfinityBridge } from '../bridge/BitfinityBridge';
	import { getAgent } from '$lib/actors/agents.ic';
	import { jsonRpcProviders } from '$eth/providers/jsonrpc.provider';

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
		// if (isDisabled()) {
		// 	const status = await waitWalletReady(isDisabled);

		// 	if (status === 'timeout') {
		// 		return;
		// 	}
		// }

		// modalStore.openConvertToTwinToken();
		if(!$authIdentity) return;

		const agent = await getAgent({ identity: $authIdentity });
		const provider =  jsonRpcProviders(BITFINITY_NETWORK_ID);
		const chain: Chain = {
			canisterId: 'pw3ee-pyaaa-aaaar-qahva-cai',
			evmChain: {
				id: 355110,
				name: 'Bitfinity Mainnet',
				nativeCurrency: {
					name: 'BTF',
					symbol: 'BTF',
					decimals: 18
				},
				blockExplorers: {
					default: {
						name: 'Bitfinity Explorer',
						url: 'https://explorer.mainnet.bitfinity.network'
					}
				},
				rpcUrls: {
					default: {
						http: ['https://mainnet.bitfinity.network']
					}
				}
			},
			contractAddress: '0x1Ad8cec9E5a4A441FE407785E188AbDeb4371468'
		};
		const bitfinityBridge = new BitfinityBridge(chain, agent, provider);
		const res = await bitfinityBridge.bridgeToICPCustom({
			tokenId: 'sICP-icrc-DKP',
			sourceAddr: '0x2D509d4a9a13084D17349d21A415ECA2B4961a1a',
			targetAddr: 'nizq7-3pdix-fdqim-arhfb-q2pvf-n4jpk-uukgm-enmpy-hebkc-dw3fc-3ae',
			amount: 10000000n,
			targetChainId: ChainID.sICP
		});
		console.log('res', res);
	};
</script>

<ButtonHero
	on:click={async () => openSend()}
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

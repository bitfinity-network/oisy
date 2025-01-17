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
	import { ChainID, ChainName, ChainState, ChainType, ICBridge, ServiceType } from '../bridge';
	import { ethAddress } from '$lib/derived/address.derived';

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
		if (!$authIdentity) return;

		const principal = $authIdentity.getPrincipal();
		const targetAddr = $ethAddress;
		if (isNullish(targetAddr)) return;

		const testParams = {
			sourceAddr: principal.toText(),
			targetAddr,
			token: {
				balance: BigInt(0),
				chain_id: ChainID.sICP,
				decimals: 8,
				fee: BigInt(100000),
				icon: 'https://raw.githubusercontent.com/octopus-network/omnity-interoperability/9061b7e2ea9e0717b47010279ff1ffd6f1f4c1fc/assets/token_logo/icp.svg',
				id: 'zfcdd-tqaaa-aaaaq-aaaga-cai',
				name: 'Dragginz',
				symbol: 'DKP',
				token_id: 'sICP-icrc-DKP'
			},
			amount: BigInt(100000000),
			feeRate: 10000,
			targetChainId: ChainID.Bitfinity
		};
		const agent = await getAgent({ identity: $authIdentity });
		const icBridge = new ICBridge(agent);
		try {
			const res = await icBridge.onBridge(testParams);
			console.log('Ticket ID:', res);
		} catch (error) {
			console.error('error', error);
		}
	};
</script>

<ButtonHero
	on:click={async () => bridgeTest()}
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

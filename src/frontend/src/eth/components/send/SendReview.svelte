<script lang="ts">
	import { isNullish } from '@dfinity/utils';
	import { createEventDispatcher, getContext } from 'svelte';
	import FeeDisplay from '$eth/components/fee/FeeDisplay.svelte';
	import SendInfo from '$eth/components/send/SendInfo.svelte';
	import SendReviewNetwork from '$eth/components/send/SendReviewNetwork.svelte';
	import { FEE_CONTEXT_KEY, type FeeContext } from '$eth/stores/fee.store';
	import type { EthereumNetwork } from '$eth/types/network';
	import SendData from '$lib/components/send/SendData.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ButtonBack from '$lib/components/ui/ButtonBack.svelte';
	import ButtonGroup from '$lib/components/ui/ButtonGroup.svelte';
	import ContentWithToolbar from '$lib/components/ui/ContentWithToolbar.svelte';
	import { ethAddress } from '$lib/derived/address.derived';
	import { i18n } from '$lib/stores/i18n.store';
	import { SEND_CONTEXT_KEY, type SendContext } from '$lib/stores/send.store';
	import type { Network } from '$lib/types/network';
	import type { OptionAmount } from '$lib/types/send';
	import { isEthAddress } from '$lib/utils/account.utils';
	import { invalidAmount, isNullishOrEmpty } from '$lib/utils/input.utils';
	import { toastsShow, toastsError } from '$lib/stores/toasts.store';
	import { type BitfinityChain } from '../../../btf/bridge';

	export let destination = '';
	export let targetNetwork: Network | undefined = undefined;
	export let sourceNetwork: EthereumNetwork | undefined = undefined;
	export let destinationEditable = true;
	export let amount: OptionAmount = undefined;
	export let source: string | undefined = undefined;

	const { feeStore: storeFeeData }: FeeContext = getContext<FeeContext>(FEE_CONTEXT_KEY);

	let invalid = true;
	$: invalid =
		isNullishOrEmpty(destination) || ($sendToken.standard !== 'icrc' && !isEthAddress(destination));
	//invalidAmount(amount) ||
	//isNullish($storeFeeData);

	console.log('invalid', invalid);

	const dispatch = createEventDispatcher();

	const { sendToken, sendBalance } = getContext<SendContext>(SEND_CONTEXT_KEY);

	async function handleSend() {
		try {
			dispatch('icSend');
		} catch (error) {
			toastsError({
				msg: {
					text: 'Failed to send tokens'
				},
				err: error
			});
		}
	}
</script>

<ContentWithToolbar>
	<SendData
		{amount}
		destination={destinationEditable ? destination : null}
		token={$sendToken}
		balance={$sendBalance}
		{source}
	>
		<FeeDisplay slot="fee" />

		<SendReviewNetwork {targetNetwork} {sourceNetwork} token={$sendToken} slot="network" />
	</SendData>

	<SendInfo />

	<ButtonGroup slot="toolbar">
		<ButtonBack on:click={() => dispatch('icBack')} />
		<Button disabled={invalid} on:click={handleSend}>
			{$i18n.send.text.send}
		</Button>
	</ButtonGroup>
</ContentWithToolbar>

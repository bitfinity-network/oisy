<script lang="ts">
	import { WizardModal, type WizardStep, type WizardSteps } from '@dfinity/gix-components';
	import { createEventDispatcher, getContext } from 'svelte';
	import type { Erc20Token } from '$eth/types/erc20';
	import type { EthereumNetwork } from '$eth/types/network';
	import { sendWizardStepsWithQrCodeScan } from '$lib/config/send.config';
	import { ProgressStepsSend } from '$lib/enums/progress-steps';
	import { WizardStepsSend } from '$lib/enums/wizard-steps';
	import { i18n } from '$lib/stores/i18n.store';
	import { SEND_CONTEXT_KEY, type SendContext } from '$lib/stores/send.store';
	import type { Network } from '$lib/types/network';
	import type { RequiredTokenWithLinkedData, Token } from '$lib/types/token';
	import { replacePlaceholders } from '$lib/utils/i18n.utils';
	import { closeModal } from '$lib/utils/modal.utils';
	import { goToWizardSendStep } from '$lib/utils/wizard-modal.utils';
	import BtfSendTokenWizard from './BTFSendTokenWizard.svelte';
	import { BITFINITY_NETWORK } from '$env/networks.env';
	import { BITFINITY_TOKEN } from '$env/tokens/tokens.eth.env';

	interface SendModalState {
		amount?: number;
		sendProgressStep: string;
		currentStep?: WizardStep;
	}

	/**
	 * Props
	 */
	export let destination = '';
	export let targetNetwork: Network | undefined = undefined;
	export let isBitfinityTwinToken = false;

	/**
	 * State initialization
	 */
	const initialState: SendModalState = {
		amount: undefined,
		sendProgressStep: ProgressStepsSend.INITIALIZATION,
		currentStep: undefined
	};

	let amount = initialState.amount;
	let sendProgressStep = initialState.sendProgressStep;
	let currentStep = initialState.currentStep;

	/**
	 * Send context store
	 */
	const { sendPurpose, sendToken } = getContext<SendContext>(SEND_CONTEXT_KEY);

	/**
	 * Network configuration
	 */
	let sourceNetwork: EthereumNetwork;
	$: sourceNetwork = isBitfinityTwinToken
		? BITFINITY_NETWORK
		: ($sendToken.network as EthereumNetwork);

	// Always set target network and destination to Bitfinity
	$: {
		targetNetwork = BITFINITY_NETWORK;
		destination = BITFINITY_NETWORK.id.toString();
	}

	/**
	 * Token configuration
	 */
	let nativeToken: Token;
	$: {
		const isOToken = $sendToken.symbol.toLowerCase().startsWith('o');
		nativeToken = {
			id: isOToken ? BITFINITY_TOKEN.id : $sendToken.id,
			network: isBitfinityTwinToken ? ($sendToken.network as EthereumNetwork) : BITFINITY_NETWORK,
			standard: isOToken ? BITFINITY_TOKEN.standard : $sendToken.standard,
			category: isOToken ? BITFINITY_TOKEN.category : $sendToken.category, // Token category can only be 'default' or 'custom'
			name: isOToken ? BITFINITY_TOKEN.name : $sendToken.name,
			symbol: isOToken ? BITFINITY_TOKEN.symbol : $sendToken.symbol,
			decimals: isOToken ? BITFINITY_TOKEN.decimals : $sendToken.decimals,
			icon: isOToken ? BITFINITY_TOKEN.icon : $sendToken.icon
		};
	}

	/**
	 * Wizard modal configuration
	 */
	let firstStep: WizardStep;
	let otherSteps: WizardStep[];
	$: [firstStep, ...otherSteps] = sendWizardStepsWithQrCodeScan({
		i18n: $i18n,
		converting: sendPurpose === 'convert-to-twin-token'
	});

	const getModalTitle = (_step: WizardStep): string => {
		if (sendPurpose === 'convert-to-twin-token') {
			const isBtcToken = ($sendToken as RequiredTokenWithLinkedData).twinTokenSymbol === 'BTC';
			return replacePlaceholders($i18n.convert.text.convert_to_token, {
				$token: isBtcToken
					? 'ckBTC'
					: isBitfinityTwinToken
						? $sendToken.symbol.slice(1)
						: $sendToken.symbol.startsWith('o')
							? $sendToken.symbol.slice(1)
							: `o${$sendToken.symbol}`
			});
		}

		if (sendPurpose === 'convert-erc20-to-ckerc20') {
			return replacePlaceholders($i18n.convert.text.convert_to_ckerc20, {
				$ckErc20: ($sendToken as Erc20Token).twinTokenSymbol ?? 'ckETH'
			});
		}

		return $i18n.send.text.send;
	};

	let steps: WizardSteps;
	$: steps = [
		{
			...firstStep,
			title: getModalTitle(firstStep)
		},
		...otherSteps
	];

	let modal: WizardModal;

	const dispatch = createEventDispatcher();

	const close = () =>
		closeModal(() => {
			// Reset to initial state
			amount = initialState.amount;
			sendProgressStep = initialState.sendProgressStep;
			currentStep = initialState.currentStep;

			// Reset props
			destination = '';
			targetNetwork = undefined;

			dispatch('nnsClose');
		});

	const handleQRCodeScan = () =>
		goToWizardSendStep({
			modal,
			steps,
			stepName: WizardStepsSend.QR_CODE_SCAN
		});

	const handleQRCodeBack = () =>
		goToWizardSendStep({
			modal,
			steps,
			stepName: WizardStepsSend.SEND
		});
</script>

<WizardModal
	{steps}
	bind:currentStep
	bind:this={modal}
	on:nnsClose={close}
	disablePointerEvents={currentStep?.name === WizardStepsSend.SENDING}
>
	<svelte:fragment slot="title">{currentStep?.title ?? ''}</svelte:fragment>

	<BtfSendTokenWizard
		{currentStep}
		{sourceNetwork}
		nativeEthereumToken={nativeToken}
		bind:destination
		bind:targetNetwork
		bind:amount
		bind:sendProgressStep
		on:icBack={modal.back}
		on:icNext={modal.next}
		on:icClose={close}
		on:icQRCodeScan={handleQRCodeScan}
		on:icQRCodeBack={handleQRCodeBack}
	/>
</WizardModal>

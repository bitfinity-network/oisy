<script lang="ts">
	import { type WizardStep } from '@dfinity/gix-components';
	import { isNullish } from '@dfinity/utils';
	import { createEventDispatcher, getContext, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import FeeContext from '$eth/components/fee/FeeContext.svelte';
	import SendForm from '$eth/components/send/SendForm.svelte';
	import SendReview from '$eth/components/send/SendReview.svelte';
	import { sendSteps } from '$eth/constants/steps.constants';
	import { enabledErc20Tokens } from '$eth/derived/erc20.derived';
	import { enabledEthereumTokens } from '$eth/derived/tokens.derived';
	import {
		FEE_CONTEXT_KEY,
		type FeeContext as FeeContextType,
		initFeeContext,
		initFeeStore
	} from '$eth/stores/fee.store';
	import type { EthereumNetwork } from '$eth/types/network';
	import { decodeQrCode } from '$eth/utils/qr-code.utils';
	import { shouldSendWithApproval } from '$eth/utils/send.utils';
	import { assertCkEthMinterInfoLoaded } from '$icp-eth/services/cketh.services';
	import { ckEthMinterInfoStore } from '$icp-eth/stores/cketh.store';
	import { toCkErc20HelperContractAddress } from '$icp-eth/utils/cketh.utils';
	import SendQRCodeScan from '$lib/components/send/SendQRCodeScan.svelte';
	import ButtonBack from '$lib/components/ui/ButtonBack.svelte';
	import ButtonCancel from '$lib/components/ui/ButtonCancel.svelte';
	import InProgressWizard from '$lib/components/ui/InProgressWizard.svelte';
	import {
		TRACK_COUNT_ETH_SEND_ERROR,
		TRACK_COUNT_ETH_SEND_SUCCESS
	} from '$lib/constants/analytics.contants';
	import { ethAddress } from '$lib/derived/address.derived';
	import { authIdentity } from '$lib/derived/auth.derived';
	import { WizardStepsSend } from '$lib/enums/wizard-steps';
	import { trackEvent } from '$lib/services/analytics.services';
	import { i18n } from '$lib/stores/i18n.store';
	import { SEND_CONTEXT_KEY, type SendContext } from '$lib/stores/send.store';
	import { toastsError } from '$lib/stores/toasts.store';
	import type { Network } from '$lib/types/network';
	import type { QrResponse, QrStatus } from '$lib/types/qr-code';
	import type { OptionAmount } from '$lib/types/send';
	import type { OptionToken, Token, TokenId } from '$lib/types/token';
	import type { IcToken } from '$icp/types/ic-token';
	import { invalidAmount, isNullishOrEmpty } from '$lib/utils/input.utils';
	import { parseToken } from '$lib/utils/parse.utils';
	import { getAgent } from '$lib/actors/agents.ic';
	import { ChainID, ICPCustomBridge } from '../bridge';
	import type { OnBridgeParams } from '../bridge/types';
	import { jsonRpcProviders } from '$eth/providers/jsonrpc.provider';
	import { BITFINITY_NETWORK_ID, ICP_NETWORK, BITFINITY_NETWORK } from '$env/networks.env';
	import { BTF_CHAIN } from '../constants';
	import { BitfinityBridge } from '../bridge/BitfinityBridge';
	import { isOmnityBridgedBitfinityToken } from '$lib/utils/token.utils';

	export let currentStep: WizardStep | undefined;
	export let formCancelAction: 'back' | 'close' = 'close';

	/**
	 * Send context store
	 */

	const { sendTokenDecimals, sendTokenId, sendToken, sendPurpose } =
		getContext<SendContext>(SEND_CONTEXT_KEY);

	/**
	 * Props
	 */

	export let destination = '';
	export let sourceNetwork: EthereumNetwork;
	export let targetNetwork: Network | undefined = undefined;
	export let amount: OptionAmount = undefined;
	export let sendProgressStep: string;
	// Required for the fee and also to retrieve ck minter information.
	// i.e. Ethereum or Sepolia "main" token.
	export let nativeEthereumToken: Token;

	let destinationEditable = true;
	$: destinationEditable = sendPurpose === 'send';

	// Set destination to eth address for bridging
	$: if (sendPurpose === 'convert-to-twin-token' && $ethAddress) {
		destination = $ethAddress;
	}

	let sendWithApproval: boolean;
	$: sendWithApproval = shouldSendWithApproval({
		to: destination,
		tokenId: $sendTokenId,
		erc20HelperContractAddress: toCkErc20HelperContractAddress(
			$ckEthMinterInfoStore?.[nativeEthereumToken.id]
		)
	});

	/**
	 * Fee context store
	 */

	let feeStore = initFeeStore();

	let feeSymbolStore = writable<string | undefined>(undefined);
	$: feeSymbolStore.set(nativeEthereumToken.symbol);

	let feeTokenIdStore = writable<TokenId | undefined>(undefined);
	$: feeTokenIdStore.set(nativeEthereumToken.id);

	let feeDecimalsStore = writable<number | undefined>(undefined);
	$: feeDecimalsStore.set(nativeEthereumToken.decimals);

	let feeContext: FeeContext | undefined;
	const evaluateFee = () => feeContext?.triggerUpdateFee();

	$: {
		console.log('Principal', $authIdentity?.getPrincipal().toText());
		console.log('Eth Address', $ethAddress);
	}

	setContext<FeeContextType>(
		FEE_CONTEXT_KEY,
		initFeeContext({
			feeStore,
			feeSymbolStore,
			feeTokenIdStore,
			feeDecimalsStore,
			evaluateFee
		})
	);

	/**
	 * Send
	 */

	const dispatch = createEventDispatcher();

	class SendValidationError extends Error {
		constructor(message: string) {
			super(message);
			this.name = 'SendValidationError';
		}
	}

	const validateSendTransaction = () => {
		if (isNullishOrEmpty(destination)) {
			throw new SendValidationError($i18n.send.assertion.destination_address_invalid);
		}

		if (invalidAmount(amount) || isNullish(amount)) {
			throw new SendValidationError($i18n.send.assertion.amount_invalid);
		}

		if ($sendToken.standard !== 'icrc' && isNullish($feeStore)) {
			throw new SendValidationError($i18n.send.assertion.gas_fees_not_defined);
		}

		if (isNullish($ethAddress)) {
			throw new SendValidationError($i18n.send.assertion.address_unknown);
		}
	};

	const handleIcrcBridgeTransaction = async () => {
		if (isNullish($authIdentity)) {
			throw new SendValidationError('No identity available for bridge');
		}

		const principal = $authIdentity.getPrincipal();
		if (isNullish(principal)) {
			throw new SendValidationError('Missing principal for bridge');
		}

		const parsedAmount = parseToken({
			value: `${amount}`,
			unitName: $sendTokenDecimals
		});

		const agent = await getAgent({ identity: $authIdentity });
		const icBridge = new ICPCustomBridge(agent);

		const bridgeParams: OnBridgeParams = {
			token: {
				id: ($sendToken as IcToken).ledgerCanisterId,
				name: $sendToken.name,
				symbol: $sendToken.symbol,
				decimals: $sendToken.decimals,
				balance: BigInt(0),
				token_id: `sICP-icrc-${$sendToken.symbol}`,
				fee: BigInt(100000),
				chain_id: ChainID.sICP
			},
			sourceAddr: principal.toText(),
			targetAddr: $ethAddress ?? '',
			amount: BigInt(parsedAmount.toString()),
			targetChainId: ChainID.Bitfinity
		};

		 await icBridge.onBridge(bridgeParams);
	};

	const handleIcrcReverseBridgeTransaction = async () => {
		if (isNullish($authIdentity)) {
			throw new SendValidationError('No identity available for bridge');
		}

		const principal = $authIdentity.getPrincipal();
		if (isNullish(principal)) {
			throw new SendValidationError('Missing principal for bridge');
		}

		const parsedAmount = parseToken({
			value: `${amount}`,
			unitName: $sendTokenDecimals
		});

		const agent = await getAgent({ identity: $authIdentity });
		const provider = jsonRpcProviders(BITFINITY_NETWORK_ID);
		const bitfinityBridge = new BitfinityBridge(BTF_CHAIN, agent, provider, $authIdentity);


		const res = await bitfinityBridge.bridgeToICPCustom({
			tokenId: `sICP-icrc-${$sendToken.twinTokenSymbol}`,
			sourceAddr: $ethAddress ?? '',
			targetAddr: principal.toText(),
			amount: BigInt(parsedAmount.toString()),
			targetChainId: ChainID.sICP
		});
		console.log('res', res);
		return res;
	};

	const handleSendError = async (err: unknown) => {
		if (err instanceof SendValidationError) {
			toastsError({
				msg: { text: err.message }
			});
			return;
		}

		await trackEvent({
			name: TRACK_COUNT_ETH_SEND_ERROR,
			metadata: {
				token: $sendToken.symbol
			}
		});

		toastsError({
			msg: { text: $i18n.send.error.unexpected },
			err
		});

		dispatch('icBack');
	};

	const send = async () => {
		try {
			validateSendTransaction();

			// Validate minter info
			const { valid } = assertCkEthMinterInfoLoaded({
				minterInfo: $ckEthMinterInfoStore?.[nativeEthereumToken.id],
				network: targetNetwork
			});

			if (!valid) {
				return;
			}

			dispatch('icNext');

			if (sendPurpose === 'convert-to-twin-token') {
				try {
					if ($sendToken.standard === 'icrc') {
						await handleIcrcBridgeTransaction();
					} else if ($sendToken.standard === 'erc20' && isOmnityBridgedBitfinityToken($sendToken)) {
						// Handle reverse bridge from Bitfinity to ICRC
						await handleIcrcReverseBridgeTransaction();
					}
				} catch (bridgeError) {
					await handleSendError(bridgeError);
					return;
				}
			}

			await trackEvent({
				name: TRACK_COUNT_ETH_SEND_SUCCESS,
				metadata: {
					token: $sendToken.symbol
				}
			});

			setTimeout(() => close(), 750);
		} catch (err: unknown) {
			await handleSendError(err);
		}
	};

	const close = () => dispatch('icClose');
	const back = () => dispatch('icSendBack');

	$: onDecodeQrCode = ({
		status,
		code,
		expectedToken
	}: {
		status: QrStatus;
		code?: string;
		expectedToken: OptionToken;
	}): QrResponse =>
		decodeQrCode({
			status,
			code,
			expectedToken,
			ethereumTokens: $enabledEthereumTokens,
			erc20Tokens: $enabledErc20Tokens
		});

	let sourceAddress: string;
	$: sourceAddress =
		$sendToken.standard === 'icrc' && $authIdentity
			? $authIdentity.getPrincipal().toText()
			: ($ethAddress ?? '');
</script>

<FeeContext
	bind:this={feeContext}
	{amount}
	{destination}
	observe={currentStep?.name !== WizardStepsSend.SENDING}
	{sourceNetwork}
	{targetNetwork}
	{nativeEthereumToken}
>
	{#if currentStep?.name === WizardStepsSend.REVIEW}
		<SendReview
			on:icBack
			on:icSend={send}
			{destination}
			{amount}
			sourceNetwork={isOmnityBridgedBitfinityToken($sendToken) ? BITFINITY_NETWORK : sourceNetwork}
			targetNetwork={isOmnityBridgedBitfinityToken($sendToken) ? ICP_NETWORK : targetNetwork}
			{destinationEditable}
			source={sourceAddress}
		/>
	{:else if currentStep?.name === WizardStepsSend.SENDING}
		<InProgressWizard
			progressStep={sendProgressStep}
			steps={sendSteps({ i18n: $i18n, sendWithApproval })}
		/>
	{:else if currentStep?.name === WizardStepsSend.SEND}
		<SendForm
			on:icNext
			on:icClose={close}
			on:icQRCodeScan
			bind:destination
			bind:amount
			bind:network={targetNetwork}
			{nativeEthereumToken}
			{destinationEditable}
			{sourceNetwork}
			source={$sendToken.standard === 'icrc' && $authIdentity
				? $authIdentity.getPrincipal().toText()
				: ($ethAddress ?? '')}
		>
			<svelte:fragment slot="cancel">
				{#if formCancelAction === 'back'}
					<ButtonBack on:click={back} />
				{:else}
					<ButtonCancel on:click={close} />
				{/if}
			</svelte:fragment>
		</SendForm>
	{:else if currentStep?.name === WizardStepsSend.QR_CODE_SCAN}
		<SendQRCodeScan
			expectedToken={$sendToken}
			bind:destination
			bind:amount
			decodeQrCode={onDecodeQrCode}
			on:icQRCodeBack
		/>
	{:else}
		<slot />
	{/if}
</FeeContext>

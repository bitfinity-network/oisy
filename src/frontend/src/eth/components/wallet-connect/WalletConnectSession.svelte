<script lang="ts">
	import { WizardModal, type WizardStep, type WizardSteps } from '@dfinity/gix-components';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { getSdkError } from '@walletconnect/utils';
	import type { Web3WalletTypes } from '@walletconnect/web3wallet';
	import { onDestroy } from 'svelte';
	import WalletConnectButton from '$eth/components/wallet-connect/WalletConnectButton.svelte';
	import WalletConnectForm from '$eth/components/wallet-connect/WalletConnectForm.svelte';
	import WalletConnectModalTitle from '$eth/components/wallet-connect/WalletConnectModalTitle.svelte';
	import WalletConnectReview from '$eth/components/wallet-connect/WalletConnectReview.svelte';
	import {
		SESSION_REQUEST_SEND_TRANSACTION,
		SESSION_REQUEST_PERSONAL_SIGN,
		SESSION_REQUEST_ETH_SIGN,
		SESSION_REQUEST_ETH_SIGN_V4
	} from '$eth/constants/wallet-connect.constants';
	import { walletConnectUri } from '$eth/derived/wallet-connect.derived';
	import { initWalletConnectListener } from '$eth/services/eth-listener.services';
	import { walletConnectPaired } from '$eth/stores/wallet-connect.store';
	import type { OptionWalletConnectListener } from '$eth/types/wallet-connect';
	import { TRACK_COUNT_WALLET_CONNECT_MENU_OPEN } from '$lib/constants/analytics.contants';
	import { ethAddress } from '$lib/derived/address.derived';
	import { modalWalletConnect, modalWalletConnectAuth } from '$lib/derived/modal.derived';
	import { trackEvent } from '$lib/services/analytics.services';
	import { busy } from '$lib/stores/busy.store';
	import { i18n } from '$lib/stores/i18n.store';
	import { loading } from '$lib/stores/loader.store';
	import { modalStore } from '$lib/stores/modal.store';
	import { toastsError, toastsShow } from '$lib/stores/toasts.store';
	import type { Option } from '$lib/types/utils';
	import { replacePlaceholders } from '$lib/utils/i18n.utils';

	export let listener: OptionWalletConnectListener;

	const STEP_CONNECT: WizardStep = {
		name: 'Connect',
		title: $i18n.wallet_connect.text.name
	};

	const STEP_REVIEW: WizardStep = {
		name: 'Review',
		title: $i18n.wallet_connect.text.session_proposal
	};

	let steps: WizardSteps = [STEP_CONNECT, STEP_REVIEW];

	let currentStep: WizardStep | undefined;
	let modal: WizardModal;

	const close = () => modalStore.close();
	const resetAndClose = () => {
		resetListener();
		close();
	};

	let proposal: Option<Web3WalletTypes.SessionProposal>;

	const disconnect = async () => {
		await disconnectListener();

		toastsShow({
			text: $i18n.wallet_connect.info.disconnected,
			level: 'info',
			duration: 2000
		});
	};

	const disconnectListener = async () => {
		try {
			await listener?.disconnect();
		} catch (err: unknown) {
			toastsError({
				msg: {
					text: $i18n.wallet_connect.error.disconnect
				},
				err
			});
		}

		resetListener();
	};

	const resetListener = () => {
		listener = undefined;
		proposal = null;
	};

	const initListener = async (uri: string) => {
		await disconnectListener();

		try {
			// Connect and disconnect buttons are disabled until the address is loaded therefore this should never happens.
			if (isNullish($ethAddress)) {
				toastsError({
					msg: { text: $i18n.send.assertion.address_unknown }
				});
				return;
			}

			listener = await initWalletConnectListener({ uri, address: $ethAddress });
		} catch (err: unknown) {
			toastsError({
				msg: { text: $i18n.wallet_connect.error.connect },
				err
			});

			resetListener();
		}
	};

	onDestroy(async () => await disconnectListener());

	const goToFirstStep = () => modal?.set?.(0);

	// One try to manually sign-in by entering the URL manually or scanning a QR code
	const userConnect = async ({ detail: uri }: CustomEvent<string>) => {
		modal.next();

		const { result } = await connect(uri);

		if (result === 'error') {
			modal.back();
		}
	};

	// One try to sign-in using the Oisy Wallet listed in the WalletConnect app and the sign-in occurs through URL
	const uriConnect = async () => {
		if (isNullish($walletConnectUri)) {
			return;
		}

		// We are still loading ETH address and other data. Boot screen load.
		if ($loading) {
			return;
		}

		// Address is not defined. We need it.
		if (isNullish($ethAddress)) {
			return;
		}

		// For simplicity reason we just display an error for now if user has already opened the WalletConnect modal.
		// Technically we could potentially check which steps is in progress and eventually jump or not but, let's keep it simple for now.
		if ($modalWalletConnectAuth) {
			toastsError({
				msg: {
					text: $i18n.wallet_connect.error.manual_workflow
				}
			});
			return;
		}

		// No step connect here
		steps = [STEP_REVIEW];

		// We open the WalletConnect auth modal on the review step
		modalStore.openWalletConnectAuth();

		await connect($walletConnectUri);
	};

	$: $ethAddress, $walletConnectUri, $loading, (async () => await uriConnect())();

	const connect = async (uri: string): Promise<{ result: 'success' | 'error' | 'critical' }> => {
		await initListener(uri);

		if (isNullish(listener)) {
			return { result: 'error' };
		}

		listener.sessionProposal((sessionProposal) => {
			// Prevent race condition
			if (isNullish(listener)) {
				return;
			}

			proposal = sessionProposal;
		});

		listener.sessionDelete(() => {
			// Prevent race condition
			if (isNullish(listener)) {
				return;
			}

			resetListener();

			toastsShow({
				text: $i18n.wallet_connect.info.session_ended,
				level: 'info',
				duration: 2000
			});

			goToFirstStep();
		});

		listener.sessionRequest(async (sessionRequest: Web3WalletTypes.SessionRequest) => {
			// Prevent race condition
			if (isNullish(listener)) {
				return;
			}

			// Another modal, like Send or Receive, is already in progress
			if (nonNullish($modalStore) && !$modalWalletConnect) {
				toastsError({
					msg: {
						text: $i18n.wallet_connect.error.skipping_request
					}
				});
				return;
			}

			const {
				id,
				topic,
				params: {
					request: { method }
				}
			} = sessionRequest;

			switch (method) {
				case SESSION_REQUEST_ETH_SIGN_V4:
				case SESSION_REQUEST_ETH_SIGN:
				case SESSION_REQUEST_PERSONAL_SIGN: {
					modalStore.openWalletConnectSign(sessionRequest);
					return;
				}
				case SESSION_REQUEST_SEND_TRANSACTION: {
					modalStore.openWalletConnectSend(sessionRequest);
					return;
				}
				default: {
					await listener?.rejectRequest({ topic, id, error: getSdkError('UNSUPPORTED_METHODS') });

					toastsError({
						msg: {
							text: replacePlaceholders($i18n.wallet_connect.error.method_not_support, {
								$method: method
							})
						}
					});

					close();
				}
			}
		});

		try {
			await listener.pair();
		} catch (err: unknown) {
			resetListener();

			toastsError({
				msg: { text: $i18n.wallet_connect.error.unexpected_pair },
				err
			});

			close();

			return { result: 'critical' };
		}

		return { result: 'success' };
	};

	const reject = async () =>
		await answer({
			callback: async () => {
				if (nonNullish(proposal)) {
					await listener?.rejectSession(proposal);
				}

				resetAndClose();
			}
		});

	const cancel = () => {
		resetListener();
		modal.back();
	};

	const approve = async () =>
		await answer({
			callback: listener?.approveSession,
			toast: () =>
				toastsShow({
					text: $i18n.wallet_connect.info.connected,
					level: 'success',
					duration: 2000
				})
		});

	const answer = async ({
		callback,
		toast
	}: {
		callback: ((proposal: Web3WalletTypes.SessionProposal) => Promise<void>) | undefined;
		toast?: () => void;
	}) => {
		if (isNullish(listener) || isNullish(callback)) {
			toastsError({
				msg: { text: $i18n.wallet_connect.error.no_connection_opened }
			});

			close();
			return;
		}

		if (isNullish(proposal)) {
			toastsError({
				msg: { text: $i18n.wallet_connect.error.no_session_approval }
			});

			close();
			return;
		}

		busy.start();

		try {
			await callback(proposal);

			toast?.();
		} catch (err: unknown) {
			toastsError({
				msg: { text: $i18n.wallet_connect.error.unexpected },
				err
			});

			resetListener();
		}

		busy.stop();

		close();
	};

	$: walletConnectPaired.set(nonNullish(listener));

	onDestroy(() => walletConnectPaired.set(false));

	const openWalletConnectAuth = async () => {
		modalStore.openWalletConnectAuth();

		await trackEvent({
			name: TRACK_COUNT_WALLET_CONNECT_MENU_OPEN
		});
	};
</script>

{#if nonNullish(listener)}
	<WalletConnectButton on:click={disconnect}
		>{$i18n.wallet_connect.text.disconnect}</WalletConnectButton
	>
{:else}
	<WalletConnectButton
		ariaLabel={$i18n.wallet_connect.text.name}
		on:click={openWalletConnectAuth}
	/>
{/if}

{#if $modalWalletConnectAuth}
	<WizardModal {steps} bind:currentStep bind:this={modal} on:nnsClose={resetAndClose}>
		<WalletConnectModalTitle slot="title">
			{`${
				currentStep?.name === 'Review' && nonNullish(proposal)
					? $i18n.wallet_connect.text.session_proposal
					: $i18n.wallet_connect.text.name
			}`}
		</WalletConnectModalTitle>

		{#if currentStep?.name === 'Review'}
			<WalletConnectReview
				{proposal}
				on:icReject={reject}
				on:icApprove={approve}
				on:icCancel={cancel}
			/>
		{:else}
			<WalletConnectForm on:icConnect={userConnect} />
		{/if}
	</WizardModal>
{/if}

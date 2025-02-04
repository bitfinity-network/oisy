<script lang="ts">
	import { debounce } from '@dfinity/utils';
	import { getContext, onDestroy, onMount } from 'svelte';
	import { infuraProviders } from '$eth/providers/infura.providers';
	import { initMinedTransactionsListener } from '$eth/services/eth-listener.services';
	import {
		getCkErc20FeeData,
		getErc20FeeData,
		getEthFeeData,
		type GetFeeData
	} from '$eth/services/fee.services';
	import { FEE_CONTEXT_KEY, type FeeContext } from '$eth/stores/fee.store';
	import type { Erc20Token } from '$eth/types/erc20';
	import type { WebSocketListener } from '$eth/types/listener';
	import type { EthereumNetwork } from '$eth/types/network';
	import { isSupportedEthTokenId } from '$eth/utils/eth.utils';
	import { isSupportedErc20TwinTokenId } from '$eth/utils/token.utils';
	import { ckEthMinterInfoStore } from '$icp-eth/stores/cketh.store';
	import {
		toCkErc20HelperContractAddress,
		toCkEthHelperContractAddress
	} from '$icp-eth/utils/cketh.utils';
	import { mapAddressStartsWith0x } from '$icp-eth/utils/eth.utils';
	import { ethAddress } from '$lib/derived/address.derived';
	import { i18n } from '$lib/stores/i18n.store';
	import { SEND_CONTEXT_KEY, type SendContext } from '$lib/stores/send.store';
	import { toastsError, toastsHide } from '$lib/stores/toasts.store';
	import type { Network } from '$lib/types/network';
	import type { OptionAmount } from '$lib/types/send';
	import type { RequiredTokenWithLinkedData, Token } from '$lib/types/token';
	import { isNetworkICP } from '$lib/utils/network.utils';
	import { parseToken } from '$lib/utils/parse.utils';
	import { jsonRpcProviders } from '$eth/providers/jsonrpc.provider';
	import { BITFINITY_NETWORK_ID } from '$env/networks.env';
	import { getAgent } from '$lib/actors/agents.ic';
	import { authIdentity } from '$lib/derived/auth.derived';
	import { BigNumber } from '@ethersproject/bignumber';
	import { ChainID, ICPCustomBridge } from '../../../btf/bridge';
	import type { IcToken } from '$icp/types/ic-token';
	import { BitfinityBridge } from '../../../btf/bridge/BitfinityBridge';
	import { BTF_CHAIN } from '../../../btf/constants';
	import { isOmnityBridgedBitfinityToken } from '$lib/utils/token.utils';

	export let observe: boolean;
	export let destination = '';
	export let amount: OptionAmount = undefined;
	export let sourceNetwork: EthereumNetwork;
	export let targetNetwork: Network | undefined = undefined;
	export let nativeEthereumToken: Token;

	const { feeStore }: FeeContext = getContext<FeeContext>(FEE_CONTEXT_KEY);

	const { sendTokenId, sendToken } = getContext<SendContext>(SEND_CONTEXT_KEY);

	/**
	 * Updating and fetching fee
	 */

	let listener: WebSocketListener | undefined = undefined;

	const errorMsgs: symbol[] = [];

	const updateFeeData = async () => {
		console.log('Send token:', $sendToken);

		try {
			if ($sendToken.standard === 'icrc') {
				if (!$authIdentity) {
					throw new Error('No identity available for ICRC fee calculation');
				}

				const icToken = $sendToken as IcToken;
				const agent = await getAgent({ identity: $authIdentity });
				const icBridge = new ICPCustomBridge(agent);

				const fee = await icBridge.getMaxFee(icToken.ledgerCanisterId);

				const feeData = {
					gas: BigNumber.from(fee.toString()),
					maxFeePerGas: BigNumber.from(fee.toString()),
					maxPriorityFeePerGas: BigNumber.from(0),
					standard: 'icrc'
				};

				feeStore.setFee(feeData);
				return;
			}

			if ($sendToken.standard === 'erc20' && isOmnityBridgedBitfinityToken($sendToken)) {
				if (!$authIdentity) {
					throw new Error('No identity available for Bitfinity fee calculation');
				}

				const agent = await getAgent({ identity: $authIdentity });
				const provider = jsonRpcProviders(BITFINITY_NETWORK_ID);
				const bitfinityBridge = new BitfinityBridge(BTF_CHAIN, agent, provider, $authIdentity);

				const fee = await bitfinityBridge.getBridgeFee(ChainID.sICP);

				const adjustedFee = BigNumber.from(fee.toString()).div(BigNumber.from(10).pow(10));

				const consolidatedFeeData = {
					gas: BigNumber.from(100000),
					maxFeePerGas: adjustedFee,
					maxPriorityFeePerGas: adjustedFee
				};

				switch (($sendToken as RequiredTokenWithLinkedData)?.twinTokenSymbol) {
					case 'BTC':
						consolidatedFeeData.gas = BigNumber.from(0);
						consolidatedFeeData.maxFeePerGas = BigNumber.from(0);
						consolidatedFeeData.maxPriorityFeePerGas = BigNumber.from(0);
						break;
				}

				feeStore.setFee({
					gas: consolidatedFeeData.gas,
					maxFeePerGas: consolidatedFeeData.maxFeePerGas,
					maxPriorityFeePerGas: consolidatedFeeData.maxPriorityFeePerGas,
					standard: 'erc20'
				});
				return;
			}

			const params: GetFeeData = {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				to: mapAddressStartsWith0x(destination !== '' ? destination : $ethAddress!),
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				from: mapAddressStartsWith0x($ethAddress!),
				networkId: $sendToken.network.id
			};

			const { getFeeData } =
				$sendToken.network.id === BITFINITY_NETWORK_ID
					? jsonRpcProviders($sendToken.network.id)
					: infuraProviders($sendToken.network.id);

			if (isSupportedEthTokenId($sendTokenId)) {
				feeStore.setFee({
					...(await getFeeData()),
					gas: getEthFeeData({
						...params,
						helperContractAddress: toCkEthHelperContractAddress({
							minterInfo: $ckEthMinterInfoStore?.[nativeEthereumToken.id],
							networkId: sourceNetwork.id
						})
					})
				});
				return;
			}

			const erc20GasFeeParams = {
				contract: $sendToken as Erc20Token,
				amount: parseToken({ value: `${amount ?? '1'}` }),
				sourceNetwork,
				...params
			};

			if (isSupportedErc20TwinTokenId($sendTokenId)) {
				feeStore.setFee({
					...(await getFeeData()),
					gas: await getCkErc20FeeData({
						...erc20GasFeeParams,
						erc20HelperContractAddress: toCkErc20HelperContractAddress(
							$ckEthMinterInfoStore?.[nativeEthereumToken.id]
						)
					})
				});
				return;
			}

			feeStore.setFee({
				...(await getFeeData()),
				gas: await getErc20FeeData({
					...erc20GasFeeParams,
					targetNetwork,
					to:
						// When converting "ICP Erc20" to native ICP, the destination address is an "old" ICP hex account identifier.
						// Therefore, it should not be prefixed with 0x.
						isNetworkICP(targetNetwork) ? destination : erc20GasFeeParams.to
				})
			});
		} catch (err: unknown) {
			toastsHide(errorMsgs);

			errorMsgs.push(
				toastsError({
					msg: { text: $i18n.fee.error.cannot_fetch_gas_fee },
					err
				})
			);
		}
	};

	const debounceUpdateFeeData = debounce(updateFeeData);

	const obverseFeeData = async (watch: boolean) => {
		await listener?.disconnect();

		if (!watch) {
			return;
		}

		debounceUpdateFeeData();

		if (sourceNetwork.id !== BITFINITY_NETWORK_ID) {
			listener = initMinedTransactionsListener({
				// eslint-disable-next-line require-await
				callback: async () => debounceUpdateFeeData(),
				networkId: sourceNetwork.id
			});
		}
	};

	onMount(() => debounceUpdateFeeData());
	onDestroy(() => listener?.disconnect());

	/**
	 * Observe input properties for erc20
	 */

	$: obverseFeeData(observe);

	$: $ckEthMinterInfoStore, debounceUpdateFeeData();

	/**
	 * Expose a call to evaluate, so that consumers can re-evaluate imperatively, for example, when the amount or destination is manually updated by the user.
	 */
	export const triggerUpdateFee = () => debounceUpdateFeeData();
</script>

<slot />

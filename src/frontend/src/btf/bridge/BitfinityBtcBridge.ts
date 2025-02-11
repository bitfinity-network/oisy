import { selectUtxosFee, sendBtc } from '$btc/services/btc-send.services';
import { BTC_MAINNET_NETWORK_ID } from '$env/networks.env';
import { IC_CKBTC_LEDGER_CANISTER_ID, IC_CKBTC_MINTER_CANISTER_ID } from '$env/networks.icrc.env';
import omnityTokens from '$env/omnity-tokens.erc20.json';
import { minterCanister } from '$icp/api/ckbtc-minter.api';
import { balance } from '$icp/api/icrc-ledger.api';
import { getAgent } from '$lib/actors/agents.ic';
import { getPendingBtcTransactions } from '$lib/api/backend.api';
import { mapNetworkIdToBitcoinNetwork, mapToSignerBitcoinNetwork } from '$lib/utils/network.utils';
import type { Identity } from '@dfinity/agent';
import type { UpdateBalanceOk } from '@dfinity/ckbtc';
import { ICPCustomBridge } from './ICPCustomBridge';
import { ChainID } from './types';

const SUBACCOUNT_OPTION = [5, 3, 7, 8];

export class BitfinityBtcBridge {
	identity: Identity;
	btcAddress: string;

	constructor(identity: Identity) {
		this.identity = identity;
		this.btcAddress = '';
	}

	getSubAccount(): Uint8Array {
		const subAccount = new Uint8Array(32);
		SUBACCOUNT_OPTION.forEach((value, index) => {
			subAccount[index] = value;
		});
		subAccount[subAccount.length - 1] = 1;

		return subAccount;
	}

	/**
	 * Get the BTC address for the user to bridge to ckBTC
	 * @returns {String} BTC address
	 */
	async getBtcAddress(): Promise<string> {
		if (this.btcAddress) {
			return this.btcAddress;
		}
		const { getBtcAddress } = await minterCanister({
			identity: this.identity,
			minterCanisterId: IC_CKBTC_MINTER_CANISTER_ID
		});
		this.btcAddress = await getBtcAddress({
			owner: this.identity.getPrincipal(),
			subaccount: this.getSubAccount()
		});
		return this.btcAddress;
	}

	/**
	 * Update the ckBTC balance for the user
	 * @returns {UpdateBalanceOk | bigint | null} ckBTC balance
	 */
	async updateckBtcBalance(): Promise<UpdateBalanceOk | bigint | null> {
		const { updateBalance } = await minterCanister({
			identity: this.identity,
			minterCanisterId: IC_CKBTC_MINTER_CANISTER_ID
		});
		try {
			const result = await updateBalance({
				owner: this.identity.getPrincipal(),
				subaccount: this.getSubAccount()
			});
			return result;
		} catch (error) {
			// if there is error check
			const ckbtcBalance = await balance({
				owner: this.identity.getPrincipal(),
				subaccount: this.getSubAccount(),
				identity: this.identity,
				ledgerCanisterId: IC_CKBTC_LEDGER_CANISTER_ID
			});
			if (ckbtcBalance > 0n) {
				return ckbtcBalance;
			}
			console.error('Error updating ckBTC balance', error);
			return null;
		}
	}

	/**
	 * Send BTC to ckBTC
	 * @param {Object} params - The parameters for sending BTC to ckBTC.
	 * @param {number} params.amount - The amount of BTC to send.
	 * @param {string} params.source - The source address of the BTC transaction.
	 * @returns {Promise<string>} The transaction hash of the BTC to ckBTC.
	 */
	async sendBTcTockBTC({ amount, source }: { amount: number; source: string }) {
		try {
			const network = mapNetworkIdToBitcoinNetwork(BTC_MAINNET_NETWORK_ID);
			if (!network) {
				throw new Error('Invalid network');
			}

			const pendingTransactions = await getPendingBtcTransactions({
				identity: this.identity,
				address: source,
				network: mapToSignerBitcoinNetwork({ network })
			});
			const utxosFee = await selectUtxosFee({
				amount,
				network,
				identity: this.identity
			});

			const btcSendParams = {
				destination: await this.getBtcAddress(),
				amount,
				utxosFee: utxosFee,
				network,
				source,
				identity: this.identity
			};
			const result = await sendBtc(btcSendParams);
			return result;
		} catch (error) {
			console.error('Error sending BTC', error);
			throw error;
		}
	}

	/**
	 * Convert ckBTC to oBTC
	 * @param {Object} params - The parameters for converting ckBTC to oBTC.
	 * @param {bigint} params.amount - The amount of ckBTC to convert.
	 * @param {string} params.targetAddress - The target address of the oBTC.
	 * @returns {Promise<string>} The transaction hash of the ckBTC to oBTC.
	 */
	async convertckBTCtoOBtc({ amount, targetAddress }: { amount: bigint; targetAddress: string }) {
		const amountToSend = amount
			? amount
			: await balance({
					owner: this.identity.getPrincipal(),
					subaccount: this.getSubAccount(),
					identity: this.identity,
					ledgerCanisterId: IC_CKBTC_LEDGER_CANISTER_ID
				});
		const agent = await getAgent({ identity: this.identity });

		const bridgeParams = {
			token: {
				id: IC_CKBTC_LEDGER_CANISTER_ID,
				name: omnityTokens.BTC.name,
				symbol: omnityTokens.BTC.symbol,
				decimals: omnityTokens.BTC.decimals,
				balance: BigInt(0),
				token_id: `sICP-icrc-ckBTC`,
				fee: BigInt(100000),
				chain_id: ChainID.sICP
			},
			sourceAddr: this.identity.getPrincipal().toText(),
			targetAddr: targetAddress,
			amount: amountToSend,
			targetChainId: ChainID.Bitfinity,
			subAccount: this.getSubAccount()
		};

		const icBridge = new ICPCustomBridge(agent);
		await icBridge.onBridge(bridgeParams);
	}

	/**
	 * Bridge btc to oBTC
	 * Update the ckBTC balance and convert it to oBTC
	 * @param {Object} params - The parameters for bridging BTC to oBTC.
	 * @param {bigint} params.amount - The amount of BTC to bridge.
	 * @param {string} params.targetAddress - The target address of the oBTC.
	 * @returns {Promise<string | null>} The transaction hash of the BTC to oBTC or null if there is no balance.
	 */
	async bridgeToOBtc({ amount = 0n, targetAddress }: { amount?: bigint; targetAddress: string }) {
		const balance = await this.updateckBtcBalance();
		if (!balance) {
			return null;
		}

		this.convertckBTCtoOBtc({ amount, targetAddress });
	}
}

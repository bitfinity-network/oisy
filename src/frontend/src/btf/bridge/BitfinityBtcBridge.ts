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

export class BitfinityBtcBridge {
	identity: Identity;
	btcAddress: string;

	constructor(identity: Identity) {
		this.identity = identity;
		this.btcAddress = '';
	}

	getSubAccount(): Uint8Array {
		const subAccount = new Uint8Array(32);
		subAccount[0] = 1;
		return subAccount;
	}

	async getBtcAddress(): Promise<string> {
		const { getBtcAddress } = await minterCanister({
			identity: this.identity,
			minterCanisterId: IC_CKBTC_MINTER_CANISTER_ID
		});
		this.btcAddress = await getBtcAddress({
			owner: this.identity.getPrincipal(),
			subaccount: this.getSubAccount()
		});
		// bc1qzszg046j3pqhs0d5gr2ruy8pttmluqcc8qjhfk
		console.log('getBtcAddress', this.btcAddress);

		return this.btcAddress;
	}

	async updateckBtcBalance(): Promise<UpdateBalanceOk | null> {
		const { updateBalance } = await minterCanister({
			identity: this.identity,
			minterCanisterId: IC_CKBTC_MINTER_CANISTER_ID
		});
		console.log('updateBalance'), updateBalance;
		try {
			const result = await updateBalance({
				owner: this.identity.getPrincipal(),
				subaccount: this.getSubAccount()
			});
			return result;
		} catch (error) {
			return null;
		}
	}

	async getBtcBalance() {
		// get btc balance
	}

	async getckBTCBalance() {
		// get ckBTC balance
	}

	async sendBTcTockBTC({ amount, source }: { amount: number; source: string }) {
		// send btc to ckBTC
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

			console.log('utxosFee', utxosFee);

			const btcSendParams = {
				destination: this.btcAddress || (await this.getBtcAddress()),
				amount,
				utxosFee: utxosFee,
				network,
				source,
				identity: this.identity
			};
			console.log('btcSendParams', btcSendParams);
			const result = await sendBtc(btcSendParams);
			console.log('result', result);
			return result;
		} catch (error) {
			console.error('Error sending BTC', error);
			throw error;
		}
	}

	async convertckBTCtoOBtc({ amount, targetAddress }: { amount: bigint; targetAddress: string }) {
		// check if ckBTC balance is enough before converting
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
		const ticketId = await icBridge.onBridge(bridgeParams);
		const status = await icBridge.checkMintStatus({ ticketId, agent });
		return status;
	}
	async bridgeToOBtc({
		amount = 0n,
		targetAddress
	}: {
		amount?: bigint;
		targetAddress: string;
	}): Promise<string | null> {
		// update btc balance
		const balance = await this.updateckBtcBalance();
		if (!balance) {
			return null;
		}

		// convert ckBTC to oBTC
		const result = await this.convertckBTCtoOBtc({ amount, targetAddress });
		return result;
	}
}

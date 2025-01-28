import type { Identity } from '@dfinity/agent';

import { selectUtxosFee, sendBtc } from '$btc/services/btc-send.services';
import { BTC_MAINNET_NETWORK_ID } from '$env/networks.env';
import { IC_CKBTC_LEDGER_CANISTER_ID, IC_CKBTC_MINTER_CANISTER_ID } from '$env/networks.icrc.env';
import omnityTokens from '$env/omnity-tokens.erc20.json';
import { minterCanister } from '$icp/api/ckbtc-minter.api';
import { getAgent } from '$lib/actors/agents.ic';
import { mapNetworkIdToBitcoinNetwork } from '$lib/utils/network.utils';
import { parseToken } from '$lib/utils/parse.utils';
import type { UpdateBalanceOk } from '@dfinity/ckbtc';
import { ICPCustomBridge } from './ICPCustomBridge';
import { ChainID } from './types';

export class OBtcBridge {
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
		return this.btcAddress;
	}

	async updateckBtcBalance(): Promise<UpdateBalanceOk> {
		const { updateBalance } = await minterCanister({
			identity: this.identity,
			minterCanisterId: IC_CKBTC_MINTER_CANISTER_ID
		});
		return await updateBalance({
			owner: this.identity.getPrincipal(),
			subaccount: this.getSubAccount()
		});
	}

	async getBtcBalance() {
		// get btc balance
	}

	async getckBTCBalance() {
		// get ckBTC balance
	}

	async sendBTcTockBTC({ amount, source }: { amount: number; source: string }) {
		// send btc to ckBTC
		const network = mapNetworkIdToBitcoinNetwork(BTC_MAINNET_NETWORK_ID);
		if (!network) {
			throw new Error('Invalid network');
		}

		const utxosFee = await selectUtxosFee({
			amount,
			network,
			identity: this.identity
		});

		await sendBtc({
			destination: this.btcAddress || (await this.getBtcAddress()),
			amount,
			utxosFee,
			network,
			source,
			identity: this.identity
		});
	}

	async convertckBTCtoOBtc(amount: number) {
		// check if ckBTC balance is enough before converting

		const agent = await getAgent({ identity: this.identity });

		const parsedAmount = parseToken({
			value: `${amount}`,
			unitName: omnityTokens.BTC.decimals
		});
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
			targetAddr: omnityTokens.BTC.address,
			amount: BigInt(parsedAmount.toString()),
			targetChainId: ChainID.Bitfinity
		};

		const icBridge = new ICPCustomBridge(agent);
		const ticketId = await icBridge.onBridge(bridgeParams);
		const status = await icBridge.checkMintStatus({ ticketId, agent });
		return status;
	}
	async bridgeToOBtc({ amount, sourceBTCAddress }: { amount: number; sourceBTCAddress: string }) {
		// send btc to ckBTC
		await this.sendBTcTockBTC({ amount, source: sourceBTCAddress });

		// update btc balance
		await this.updateckBtcBalance();

		// convert ckBTC to oBTC
		const result = await this.convertckBTCtoOBtc(amount);
		return result;
	}
}

import type { Identity } from '@dfinity/agent';

import { IC_CKBTC_LEDGER_CANISTER_ID, IC_CKBTC_MINTER_CANISTER_ID } from '$env/networks.icrc.env';
import omnityTokens from '$env/omnity-tokens.erc20.json';
import { minterCanister } from '$icp/api/ckbtc-minter.api';
import { getAgent } from '$lib/actors/agents.ic';
import type { UpdateBalanceOk } from '@dfinity/ckbtc';
import { ICPCustomBridge } from './ICPCustomBridge';
import { ChainID } from './types';

export class OBtcBridge {
	identity: Identity;

	constructor(identity: Identity) {
		this.identity = identity;
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
		return await getBtcAddress({
			owner: this.identity.getPrincipal(),
			subaccount: this.getSubAccount()
		});
	}

	async updateBtcBalance(): Promise<UpdateBalanceOk> {
		const { updateBalance } = await minterCanister({
			identity: this.identity,
			minterCanisterId: IC_CKBTC_MINTER_CANISTER_ID
		});
		return await updateBalance({
			owner: this.identity.getPrincipal(),
			subaccount: this.getSubAccount()
		});
	}

	async convertckBTCtoOBtc() {
		const agent = await getAgent({ identity: this.identity });

		const bridgeParams = {
			token: {
				id: IC_CKBTC_LEDGER_CANISTER_ID,
				name: omnityTokens.BTC.name,
				symbol: omnityTokens.BTC.symbol,
				decimals: omnityTokens.BTC.decimals,
				balance: BigInt(0),
				token_id: `sICP-icrc-${omnityTokens.BTC.symbol}`,
				fee: BigInt(100000),
				chain_id: ChainID.sICP
			},
			sourceAddr: this.identity.getPrincipal().toText(),
			targetAddr: omnityTokens.BTC.address,
			amount: BigInt(1),
			targetChainId: ChainID.Bitfinity
		};

		const icBridge = new ICPCustomBridge(agent);
		const ticketId = await icBridge.onBridge(bridgeParams);
		const status = await icBridge.checkMintStatus({ ticketId, agent });
		// get ckbtc address
		// get ckbtc balance
		// convert ckbtc to obtc
		// update obtc balance
	}

	/* 
        1. convert btc to ckbtc
        2. convert ckbtc to obtc
    

        // show new address for obtc in btc modal ---
    */
}

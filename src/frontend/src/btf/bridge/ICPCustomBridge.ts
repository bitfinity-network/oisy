import { type Agent } from '@dfinity/agent';

import { IcrcLedgerCanister } from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';
import { idlFactory as ICPCustomsInterfaceFactory, type _SERVICE } from './candids/IcpCustoms.did';
import {
	idlFactory as IcrcLedgerInterfaceFactory,
	type _SERVICE as IcrcLedgerService
} from './candids/IcrcLedger.did';
import type { OnBridgeParams, Token } from './types';
import { createActor } from './utils';

const icpChainCanisterId = 'nlgkm-4qaaa-aaaar-qah2q-cai';
export class ICPCustomBridge {
	agent: Agent;

	constructor(agent: Agent) {
		this.agent = agent;
	}

	async onBridge(params: OnBridgeParams): Promise<string> {
		const { token, sourceAddr, targetAddr, targetChainId, amount } = params;

		const actor = await createActor<_SERVICE>({
			canisterId: icpChainCanisterId,
			interfaceFactory: ICPCustomsInterfaceFactory,
			agent: this.agent
		});

		await this.prepareForGenerateTicket({
			token,
			userAddr: sourceAddr,
			amount
		});

		const ticketResult = await actor.generate_ticket_v2({
			token_id: token.token_id,
			from_subaccount: [],
			target_chain_id: targetChainId,
			amount,
			receiver: targetAddr,
			memo: []
		});

		if ('Err' in ticketResult) {
			console.error(ticketResult.Err);
			throw new Error('Failed to generate ticket', { cause: ticketResult.Err });
		}

		return ticketResult.Ok.ticket_id;
	}

	async onApprove({
		token,
		sourceAddr,
		amount
	}: Pick<OnBridgeParams, 'token' | 'sourceAddr' | 'amount'>): Promise<void> {
		const spender = Principal.fromText(icpChainCanisterId);
		const account = Principal.fromText(sourceAddr);

		const { allowance, transactionFee } = IcrcLedgerCanister.create({
			canisterId: Principal.fromText(token.id)
		});

		const txFee = await transactionFee({ certified: false });

		const approvingAmount = amount + txFee;

		const { allowance: allowanceAmount } = await allowance({
			spender: {
				owner: spender,
				subaccount: []
			},
			account: {
				owner: account,
				subaccount: []
			}
		});

		if (allowanceAmount < approvingAmount) {
			const icrcLedger = await createActor<IcrcLedgerService>({
				canisterId: token.id,
				interfaceFactory: IcrcLedgerInterfaceFactory,
				agent: this.agent
			});

			try {
				await icrcLedger.icrc2_approve({
					fee: [],
					memo: [],
					from_subaccount: [],
					created_at_time: [],
					amount: approvingAmount,
					spender: {
						owner: spender,
						subaccount: []
					},
					expires_at: [],
					expected_allowance: []
				});
			} catch (error) {
				console.error('Approval failed:', error);
				throw error;
			}
		}
	}

	async prepareForGenerateTicket({
		token,
		userAddr,
		amount
	}: {
		token: Token;
		userAddr: string;
		amount: bigint;
	}) {
		await this.onApprove({
			token,
			sourceAddr: userAddr,
			amount
		});
	}

	async checkMintStatus({
		ticketId,
		agent
	}: {
		ticketId: string;
		agent: Agent;
	}): Promise<'Finalized' | 'Unknown'> {
		const actor = createActor<_SERVICE>({
			canisterId: icpChainCanisterId,
			interfaceFactory: ICPCustomsInterfaceFactory,
			agent
		});

		const status = await actor.mint_token_status(ticketId);

		if ('Finalized' in status) {
			return 'Finalized';
		}
		return 'Unknown';
	}

	async getTokenList({ agent }: { agent: Agent }) {
		const actor = createActor<_SERVICE>({
			canisterId: icpChainCanisterId,
			interfaceFactory: ICPCustomsInterfaceFactory,
			agent
		});

		const tokens = await actor.get_token_list();
		return tokens;
	}

	async getMaxFee(tokenId: string): Promise<bigint> {
		const ledger = IcrcLedgerCanister.create({
			canisterId: Principal.fromText(tokenId)
		});

		const txFee = await ledger.transactionFee({ certified: false });

		return txFee;
	}
}

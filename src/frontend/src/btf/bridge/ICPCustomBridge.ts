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

const icpCustomInterfaceCanisterId = 'nlgkm-4qaaa-aaaar-qah2q-cai';
export class ICPCustomBridge {
	agent: Agent;

	constructor(agent: Agent) {
		this.agent = agent;
	}

	async onBridge(params: OnBridgeParams): Promise<string> {
		const { token, sourceAddr, targetAddr, targetChainId, amount, subAccount } = params;

		const minFee = await this.getMaxFee(token.id);
		if (amount <= minFee) {
			const divisor = BigInt(10 ** token.decimals);
			throw new Error(
				`Amount (${Number(amount) / Number(divisor)}) must be greater than the transaction fee (${
					Number(minFee) / Number(divisor)
				} ${token.symbol})`
			);
		}

		const actor = await createActor<_SERVICE>({
			canisterId: icpCustomInterfaceCanisterId,
			interfaceFactory: ICPCustomsInterfaceFactory,
			agent: this.agent
		});

		await this.prepareForGenerateTicket({
			token,
			userAddr: sourceAddr,
			amount,
			subAccount
		});

		const ticketResult = await actor.generate_ticket_v2({
			token_id: token.token_id,
			from_subaccount: subAccount ? [subAccount] : [],
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
		amount,
		subAccount
	}: Pick<OnBridgeParams, 'token' | 'sourceAddr' | 'amount' | 'subAccount'>): Promise<void> {
		const spender = Principal.fromText(icpCustomInterfaceCanisterId);
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
				subaccount: subAccount ? [subAccount] : []
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
					from_subaccount: subAccount ? [subAccount] : [],
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
		amount,
		subAccount
	}: {
		token: Token;
		userAddr: string;
		amount: bigint;
		subAccount?: Uint8Array;
	}) {
		await this.onApprove({
			token,
			sourceAddr: userAddr,
			amount,
			subAccount
		});
	}

	async getMaxFee(tokenId: string): Promise<bigint> {
		const ledger = IcrcLedgerCanister.create({
			canisterId: Principal.fromText(tokenId)
		});

		const txFee = await ledger.transactionFee({ certified: false });

		return txFee;
	}
}

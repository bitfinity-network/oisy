/* eslint-disable no-console */
//For the time being ^
import { type ActorSubclass, type Agent } from '@dfinity/agent';

import type { IDL } from '@dfinity/candid';
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
export class ICBridge {
	// private chain: Chain;
	// private provider: JsonRpcProvider;
	// private signer: ethers.Signer;
	agent: Agent;

	constructor(agent: Agent) {
		this.agent = agent;
		// this.provider = provider;
		// this.signer = this.provider.getSigner();
	}

	async onBridge(params: OnBridgeParams): Promise<string> {
		const { token, sourceAddr, targetAddr, targetChainId, amount } = params;

		const actor = await createActor<_SERVICE>({
			canisterId: icpChainCanisterId,
			interfaceFactory: ICPCustomsInterfaceFactory,
			agent: this.agent
		});

		const result = await this.prepareForGenerateTicket({
			token,
			userAddr: sourceAddr,
			amount
		});

		console.log('prepareForGenerateTicketResult', result);
		const ticketResult = await actor.generate_ticket_v2({
			token_id: token.token_id,
			from_subaccount: [],
			target_chain_id: targetChainId,
			amount,
			receiver: targetAddr,
			memo: []
		});

		console.log('ticketResult', ticketResult);

		if ('Err' in ticketResult) {
			console.error(ticketResult.Err);
			throw new Error('Failed to generate ticket');
		}

		return ticketResult.Ok.ticket_id;
	}

	async onApprove({
		token,
		sourceAddr,
		amount
	}: Pick<OnBridgeParams, 'token' | 'sourceAddr' | 'amount'>): Promise<void> {
		console.log('Amount to bridge:', Number(amount) / Math.pow(10, token.decimals), token.symbol);

		const spender = Principal.fromText(icpChainCanisterId);
		const account = Principal.fromText(sourceAddr);

		const { allowance, transactionFee } = IcrcLedgerCanister.create({
			canisterId: Principal.fromText(token.id)
		});

		const txFee = await transactionFee({ certified: false });
		console.log('Transaction Fee:', Number(txFee) / Math.pow(10, token.decimals), token.symbol);

		const approvingAmount = amount + txFee;
		console.log(
			'Total amount to approve:',
			Number(approvingAmount) / Math.pow(10, token.decimals),
			token.symbol
		);

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

		console.log(
			'Current allowance:',
			Number(allowanceAmount) / Math.pow(10, token.decimals),
			token.symbol
		);

		if (allowanceAmount < approvingAmount) {
			console.log('Current allowance insufficient. Initiating approval...');

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
				console.log('Approval successful!');
			} catch (error) {
				console.error('Approval failed:', error);
				throw error;
			}
		} else {
			console.log('Current allowance is sufficient, skipping approval');
		}
	}

	async prepareForGenerateTicket({
		token,
		userAddr,
		amount,
		createActor
	}: {
		token: Token;
		userAddr: string;
		amount: bigint;
		createActor?: <T>(
			canisterId: string,
			interfaceFactory: IDL.InterfaceFactory
		) => Promise<ActorSubclass<T>>;
	}) {
		console.log('starting prepareForGenerateTicket');

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

		console.log('Ticket Status:', status);

		if ('Finalized' in status) {
			console.log('Transaction Hash:', status.Finalized.tx_hash);
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
		console.log('Available Tokens:', tokens);
		return tokens;
	}
}

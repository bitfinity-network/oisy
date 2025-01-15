import type { EthSignTransactionRequest } from '$declarations/signer/signer.did';
import type { JsonRpcProvider } from '$eth/providers/jsonrpc.provider';
import { signTransaction } from '$lib/api/signer.api';
import type { ActorSubclass, Agent } from '@dfinity/agent';
import { ethers } from 'ethers';
import { idlFactory, type TokenResp, type _SERVICE } from './candids/Omnity.did';
import type {
	BridgeFee,
	BridgeStatus,
	BridgeStatusResult,
	BridgeTicket,
	BridgeToEvmParams,
	Chain,
	Token
} from './types';
import { createActor } from './utils';

// type EvmAddress = `0x${string}`;

export class IcBitfinityBridge {
	private actor: ActorSubclass<_SERVICE>;
	private chain: Chain;
	private provider: JsonRpcProvider;
	private signer: ethers.Signer;

	constructor(chain: Chain, agent: Agent, provider: JsonRpcProvider) {
		this.chain = chain;
		this.provider = provider;
		this.signer = this.provider.getSigner();
		this.actor = createActor<_SERVICE>({
			canisterId: chain.canisterId,
			interfaceFactory: idlFactory,
			agent
		});
	}

	async bridgeToEvm(params: BridgeToEvmParams) {
		try {
			const { tokenId, targetEvmAddress, amount, identity } = params;
			const gasLimit = 21000n;
			const gasPrice = 343597383680n;
			const gasCost = gasLimit * gasPrice;

			const totalAmountWei = 10000000000000000n;

			const transferAmount = totalAmountWei - gasCost;

			const nonce = await this.provider.getTransactionCount(targetEvmAddress);

			const { data } = await this.provider.populateTransaction({
				contract: { address: this.chain.contractAddress! },
				tokenId,
				to: targetEvmAddress,
				amount: ethers.BigNumber.from(transferAmount),
				fee: ethers.BigNumber.from(gasCost),
				chainId: Number(this.chain.chainId)
			});

			console.log('data', data);
			console.log('nonce', nonce);

			const transaction: EthSignTransactionRequest = {
				to: '0x1Ad8cec9E5a4A441FE407785E188AbDeb4371468',
				gas: gasLimit,
				value: 0n,
				max_priority_fee_per_gas: gasPrice,
				nonce: BigInt(nonce),
				max_fee_per_gas: gasPrice,
				chain_id: 355110n,
				data: [data!]
			};

			const signedTransaction = await signTransaction({
				identity,
				transaction
			});

			console.log('signedTransaction', signedTransaction);

			const tx = await this.provider.sendTransaction(signedTransaction);
			await tx.wait();

			console.log('tx', tx);
			console.log('hash', tx.hash);

			return tx.hash;
		} catch (error) {
			console.log('error', error);
			if (error instanceof Error) {
				if (error.message.includes('User rejected the request')) {
					throw new Error('User rejected the transaction');
				}
			}
			throw error;
		}
	}

	async getBridgeFee(): Promise<BridgeFee> {
		console.log('actor for fee', this.actor);
		console.log('chain for fee', this.chain);
		//const list = await this.actor.get_token_list

		const [fee = 0n] = await this.actor.get_fee(this.chain.chainId.toString());

		const { symbol, decimals } = this.chain.evmChain!.nativeCurrency;
		return {
			fee,
			symbol,
			decimals
		};
	}

	async getTokenList(): Promise<Token[]> {
		try {
			const tokenList = await this.actor.get_token_list();

			const tokens = tokenList.map((t: TokenResp) => {
				try {
					const { decimals, icon, evm_contract, symbol, token_id } = t;
					const contractAddress = evm_contract[0];
					if (!contractAddress) {
						throw new Error('Missing token contract address');
					}
					const name = token_id.split('-')[2];
					return {
						decimals,
						symbol,
						name,
						tokenId: token_id,
						contractAddress,
						balance: 0n,
						icon: icon[0] ?? ''
					} as Token;
				} catch (error) {
					return null;
				}
			});
			return tokens.filter((t): t is Token => t !== null);
		} catch (error) {
			return [];
		}
	}

	async getBridgeStatus(ticket: BridgeTicket): Promise<BridgeStatusResult> {
		const res = await this.actor.mint_token_status(ticket.ticketId);
		const status = Object.keys(res)[0] as BridgeStatus;
		const statusValue = Object.values(res)[0] as { tx_hash?: string };
		let evmTxHash;
		if (status === 'Finalized') {
			evmTxHash = statusValue?.tx_hash;
		}
		return {
			status,
			evmTxHash
		};
	}

	static validateEvmAddress(addr: string): boolean {
		return ethers.utils.isAddress(addr);
	}
}

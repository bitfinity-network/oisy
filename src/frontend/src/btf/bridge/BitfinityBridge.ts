import type { EthSignTransactionRequest } from '$declarations/signer/signer.did';
import { type JsonRpcProvider } from '$eth/providers/jsonrpc.provider';
import type { ActorSubclass, Agent, Identity } from '@dfinity/agent';
import { ethers } from 'ethers';
import { idlFactory, type _SERVICE } from './candids/Omnity.did';
import { OMNITY_PORT_ABI } from './constants';
import type { Chain } from './types';
import { createActor } from './utils';

export class BitfinityBridge {
	private actor: ActorSubclass<_SERVICE>;
	private chain: Chain;
	private provider: JsonRpcProvider;
	private identity: Identity;

	constructor(chain: Chain, agent: Agent, provider: JsonRpcProvider, identity: Identity) {
		this.chain = chain;
		this.provider = provider;
		this.identity = identity;

		this.actor = createActor<_SERVICE>({
			canisterId: chain.canisterId,
			interfaceFactory: idlFactory,
			agent
		});
	}

	async getBridgeFee(targetChainId: string): Promise<bigint> {
		const [fee] = await this.actor.get_fee(targetChainId);
		if (!fee) {
			throw new Error('Failed to get fee from actor');
		}
		return fee;
	}

	async generateTicket(txHash: string): Promise<{ finalized: boolean; message?: string }> {
		const result = await this.actor.generate_ticket(txHash);
		if ('Ok' in result) {
			return { finalized: true };
		}
		const error = result.Err;
		if (error === 'duplicate request' || error === 'call hub error') {
			return { finalized: true };
		}

		throw new Error('Failed to generate ticket');
	}

	async bridgeToICPCustom(params: {
		tokenId: string;
		sourceAddr: string;
		targetAddr: string;
		amount: bigint;
		targetChainId: string;
	}) {
		const { tokenId, sourceAddr, targetAddr, amount, targetChainId } = params;

		const portContractAddr = this.chain.contractAddress;
		if (!portContractAddr) {
			throw new Error('Missing port contract address');
		}

		const btfBalance = await this.provider.balance(sourceAddr);
		if (btfBalance.isZero()) {
			throw new Error('No BTF balance found in source address');
		}

		try {
			// Get the bridge fee
			const fee = await this.getBridgeFee(targetChainId);

			const gasPrice = BigInt('343597383687');
			const gasLimit = 100_000n;
			const totalCost = fee + gasPrice * gasLimit;

			const balance = await this.provider.balance(sourceAddr);

			if (balance.toBigInt() < totalCost) {
				console.error('Insufficient balance:', {
					required: totalCost.toString(),
					fee: fee.toString(),
					estimatedGas: (gasPrice * gasLimit).toString(),
					available: balance.toString(),
					difference: (totalCost - balance.toBigInt()).toString()
				});
				throw new Error(
					`Insufficient balance for transaction. Required (including gas): ${totalCost}, Available: ${balance.toString()}`
				);
			}

			const portContract = new ethers.Contract(portContractAddr, OMNITY_PORT_ABI);
			const populatedTx = await portContract.populateTransaction.redeemToken(
				tokenId,
				targetAddr,
				amount,
				{
					value: fee
				}
			);

			const nonce = await this.provider.getTransactionCount(sourceAddr);

			const transaction: EthSignTransactionRequest = {
				to: portContractAddr,
				value: fee,
				data: populatedTx.data ? [populatedTx.data] : [],
				nonce: BigInt(nonce),
				gas: 100_000n,
				max_priority_fee_per_gas: 343597383687n,
				max_fee_per_gas: 343597383687n,
				chain_id: BigInt(this.chain.evmChain!.id)
			};

			const signedTx = await this.provider.signTransaction({
				transaction,
				identity: this.identity
			});

			const txResponse = await this.provider.sendTransaction(signedTx);

			const txWait = await txResponse.wait();
			const ticket = await this.generateTicket(txWait.transactionHash);

			return ticket;
		} catch (error) {
			console.error('Bridge transaction failed:', error);
			if (error instanceof Error) {
				throw new Error(`Bridge transaction failed: ${error.message}`);
			}
			throw error;
		}
	}
}

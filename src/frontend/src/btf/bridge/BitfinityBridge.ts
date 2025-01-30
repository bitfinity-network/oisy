/* eslint-disable no-console */
import type { EthSignTransactionRequest } from '$declarations/signer/signer.did';
import type { JsonRpcProvider } from '$eth/providers/jsonrpc.provider';
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

	async bridgeToICPCustom(params: {
		tokenId: string;
		sourceAddr: string;
		targetAddr: string;
		amount: bigint;
		targetChainId: string;
	}) {
		const { tokenId, sourceAddr, targetAddr, amount, targetChainId } = params;
		console.log('Bridge params:', {
			tokenId,
			sourceAddr,
			targetAddr,
			amount: amount.toString(),
			targetChainId
		});

		const portContractAddr = this.chain.contractAddress;
		if (!portContractAddr) {
			throw new Error('Missing port contract address');
		}
		console.log('Port contract address:', portContractAddr);

		try {
			// Get the bridge fee
			const fee = await this.getBridgeFee(targetChainId);
			console.log('Bridge fee:', fee.toString());

			const gasPrice = BigInt('343597383687');
			const gasLimit = 100_000n;
			const totalCost = fee + gasPrice * gasLimit;

			const balance = await this.provider.balance(sourceAddr);
			console.log('User balance:', balance.toString());
			console.log('Total required (fee + gas):', totalCost.toString());

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
			console.log('Populated transaction:', populatedTx);

			const nonce = await this.provider.getTransactionCount(sourceAddr);
			console.log('Transaction nonce:', nonce);

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
			console.log('Transaction request:', {
				...transaction,
				value: transaction.value.toString(),
				nonce: transaction.nonce.toString(),
				gas: transaction.gas.toString(),
				max_priority_fee_per_gas: transaction.max_priority_fee_per_gas.toString(),
				max_fee_per_gas: transaction.max_fee_per_gas.toString(),
				chain_id: transaction.chain_id.toString()
			});

			const signedTx = await this.provider.signTransaction({
				transaction,
				identity: this.identity
			});
			console.log('Signed transaction:', signedTx);

			const txResponse = await this.provider.sendTransaction(signedTx);
			console.log('Transaction response:', txResponse);

			const txWait = await txResponse.wait();
			console.log('Transaction receipt:', txWait);

			return txResponse.hash;
		} catch (error) {
			console.error('Bridge transaction failed:', error);
			if (error instanceof Error) {
				throw new Error(`Bridge transaction failed: ${error.message}`);
			}
			throw error;
		}
	}
}

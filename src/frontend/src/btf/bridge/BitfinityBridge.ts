import type { EthSignTransactionRequest } from '$declarations/signer/signer.did';
import type { JsonRpcProvider } from '$eth/providers/jsonrpc.provider';
import type { ActorSubclass, Agent, Identity } from '@dfinity/agent';
import { ethers } from 'ethers';
import { idlFactory, type _SERVICE } from './candids/Omnity.did';
import { OMNITY_PORT_ABI } from './constants';
import type { Chain } from './types';
import { createActor } from './utils';

type EvmAddress = `0x${string}`;

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

	async bridgeToICPCustom(params: {
		tokenId: string;
		sourceAddr: string;
		targetAddr: string;
		amount: bigint;
		targetChainId: string;
	}): Promise<string> {
		const { tokenId, sourceAddr, targetAddr, amount, targetChainId } = params;

		const portContractAddr = this.chain.contractAddress;
		if (!portContractAddr) {
			throw new Error('Missing port contract address');
		}

		const portContract = new ethers.Contract(portContractAddr, OMNITY_PORT_ABI);

		try {
			const [fee] = await this.actor.get_fee(targetChainId);
			console.log('fee', fee);
			if (!fee) {
				throw new Error('Failed to get fee from actor');
			}

			const populatedTx = await portContract.populateTransaction.redeemToken(
				tokenId,
				targetAddr,
				amount,
				{
					value: fee
				}
			);
			const nonce = await this.provider.getTransactionCount(sourceAddr);
			const feeData = await this.provider.getFeeData();

			const transaction: EthSignTransactionRequest = {
				to: portContractAddr,
				value: fee,
				data: populatedTx.data ? [populatedTx.data] : [],
				nonce: BigInt(nonce),
				gas: 21000n,
				max_priority_fee_per_gas: feeData.maxPriorityFeePerGas?.toBigInt() ?? BigInt(0),
				max_fee_per_gas: feeData.maxFeePerGas?.toBigInt() ?? BigInt(0),
				chain_id: BigInt(this.chain.evmChain!.id)
			};

			const signedTx = await this.provider.signTransaction(transaction, this.identity);
			const txResponse = await this.provider.sendTransaction(signedTx);
			console.log('txResponse', txResponse);

			return txResponse.hash;
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Bridge transaction failed: ${error.message}`);
			}
			throw error;
		}
	}
}

import type { JsonRpcProvider } from '$eth/providers/jsonrpc.provider';
import type { ActorSubclass, Agent } from '@dfinity/agent';
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
	private signer: ethers.Signer;

	constructor(chain: Chain, agent: Agent, provider: JsonRpcProvider) {
		this.chain = chain;

		this.actor = createActor<_SERVICE>({
			canisterId: chain.canisterId,
			interfaceFactory: idlFactory,
			agent
		});

		this.provider = provider;
		this.signer = this.provider.getSigner();
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

		const portContract = new ethers.Contract(portContractAddr, OMNITY_PORT_ABI, this.signer);

		try {
			const [fee] = await this.actor.get_fee(targetChainId);

			console.info('Bridge Transaction Details:', {
				chain: this.chain.evmChain,
				targetChainId,
				sourceAddr,
				tokenId,
				targetAddr,
				amount,
				fee,
				portContractAddr
			});

			const txHash = await portContract.write.redeemToken([tokenId, targetAddr, amount], {
				account: sourceAddr as EvmAddress,
				chain: this.chain.evmChain,
				value: fee
			});

			return txHash;
		} catch (error) {
			console.error('Bridge Transaction Failed:', error);
			if (error instanceof Error) {
				throw new Error(`Bridge transaction failed: ${error.message}`);
			}
			throw error;
		}
	}
}

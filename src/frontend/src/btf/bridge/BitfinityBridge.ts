import type { ActorSubclass } from '@dfinity/agent';
import { ethers } from 'ethers';
import { idlFactory, type TokenResp, type _SERVICE } from './candids/Omnity.did';
import { OMNITY_PORT_ABI } from './constants';
import type {
	BitfinityChain,
	BridgeFee,
	BridgeStatus,
	BridgeStatusResult,
	BridgeTicket,
	BridgeToEvmParams,
	Token
} from './types';
import { createActor } from './utils';

// type EvmAddress = `0x${string}`;

export class IcBitfinityBridge {
	private actor: ActorSubclass<_SERVICE>;
	private chain: BitfinityChain;
	private provider: ethers.providers.Web3Provider;
	private signer: ethers.Signer;

	constructor(chain: BitfinityChain) {
		this.chain = chain;
		this.actor = createActor<_SERVICE>(chain.canisterId, idlFactory);

		// Initialize ethers provider and signer
		this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
		this.signer = this.provider.getSigner();
	}

	async bridgeToEvm(params: BridgeToEvmParams): Promise<string> {
		try {
			const { token, sourceIcAddress, targetEvmAddress, amount } = params;

			const portContract = new ethers.Contract(
				this.chain.portContractAddress,
				OMNITY_PORT_ABI,
				this.signer
			);

			const { fee } = await this.getBridgeFee();

			const tx = await portContract.transportToken(
				this.chain.chainId.toString(),
				token.tokenId,
				targetEvmAddress,
				amount,
				'',
				{
					value: fee
				}
			);

			const receipt = await tx.wait();
			return receipt.transactionHash;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes('User rejected the request')) {
					throw new Error('User rejected the transaction');
				}
			}
			throw error;
		}
	}

	async getBridgeFee(): Promise<BridgeFee> {
		const [fee] = await this.actor.get_fee(this.chain.chainId.toString());
		if (fee === undefined) {
			throw new Error('Failed to get bridge fee');
		}

		const { symbol, decimals } = this.chain.evmChain.nativeCurrency;
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

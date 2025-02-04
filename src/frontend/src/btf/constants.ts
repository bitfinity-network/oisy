import type { Chain } from './bridge/types';

export const BTF_CHAIN: Chain = {
	canisterId: 'pw3ee-pyaaa-aaaar-qahva-cai',
	evmChain: {
		id: 355110,
		name: 'Bitfinity Mainnet',
		nativeCurrency: {
			name: 'BTF',
			symbol: 'BTF',
			decimals: 18
		},
		blockExplorers: {
			default: {
				name: 'Bitfinity Explorer',
				url: 'https://explorer.mainnet.bitfinity.network'
			}
		},
		rpcUrls: {
			default: {
				http: ['https://mainnet.bitfinity.network']
			}
		}
	},
	contractAddress: '0x1Ad8cec9E5a4A441FE407785E188AbDeb4371468'
};

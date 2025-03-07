import { ETHEREUM_NETWORK, SEPOLIA_NETWORK, BITFINITY_NETWORK } from '$env/networks.env';
import { ETH_MAINNET_ENABLED } from '$env/networks.eth.env';
import type { EthereumNetwork } from '$eth/types/network';
import { testnets } from '$lib/derived/testnets.derived';
import type { NetworkId } from '$lib/types/network';
import { derived, type Readable } from 'svelte/store';

export const enabledEthereumNetworks: Readable<EthereumNetwork[]> = derived(
	[testnets],
	([$testnets]) => [
		...(ETH_MAINNET_ENABLED ? [ETHEREUM_NETWORK] : []),
		...($testnets ? [SEPOLIA_NETWORK] : []),
		BITFINITY_NETWORK
	]
);

export const enabledEthereumNetworksIds: Readable<NetworkId[]> = derived(
	[enabledEthereumNetworks],
	([$ethereumNetworks]) => $ethereumNetworks.map(({ id }) => id)
);

<script lang="ts">
	import { Dropdown, DropdownItem } from '@dfinity/gix-components';
	import { debounce, isNullish, nonNullish } from '@dfinity/utils';
	import { getContext } from 'svelte';
	import { ETHEREUM_NETWORK, ICP_NETWORK } from '$env/networks.env';
	import type { EthereumNetwork } from '$eth/types/network';
	import { isDestinationContractAddress } from '$eth/utils/send.utils';
	import { ckEthMinterInfoStore } from '$icp-eth/stores/cketh.store';
	import { toCkEthHelperContractAddress } from '$icp-eth/utils/cketh.utils';
	import { i18n } from '$lib/stores/i18n.store';
	import { SEND_CONTEXT_KEY, type SendContext } from '$lib/stores/send.store';
	import type { Network } from '$lib/types/network';
	import { isEthAddress, isIcpAccountIdentifier } from '$lib/utils/account.utils';

	export let network: Network | undefined = undefined;
	export let destination: string | undefined = undefined;
	// TODO: to be removed once minterInfo breaking changes have been executed on mainnet
	export let sourceNetwork: EthereumNetwork;

	const { sendTokenId } = getContext<SendContext>(SEND_CONTEXT_KEY);

	let networkName: string | undefined = network?.name;

	const onDestinationAddressInput = debounce(() => {
		if (nonNullish(network)) {
			// A network was already manually selected except if disabled, in that case we always recalculate the network based on the provided destination
			return;
		}

		if (isNullish(destination) || destination === '') {
			networkName = undefined;
			return;
		}

		if (
			isDestinationContractAddress({
				destination,
				contractAddress: toCkEthHelperContractAddress({
					minterInfo: $ckEthMinterInfoStore?.[$sendTokenId],
					networkId: sourceNetwork.id
				})
			})
		) {
			networkName = ICP_NETWORK.name;
			return;
		}

		if (isEthAddress(destination)) {
			networkName = ETHEREUM_NETWORK.name;
			return;
		}

		if (isIcpAccountIdentifier(destination)) {
			networkName = ICP_NETWORK.name;
		}
	});

	$: destination, onDestinationAddressInput();

	$: networkName,
		(() => {
			switch (networkName) {
				case undefined:
					network = undefined;
					break;
				case ETHEREUM_NETWORK.name:
					network = ETHEREUM_NETWORK;
					break;
				case ICP_NETWORK.name:
					network = ICP_NETWORK;
					break;
			}
		})();
</script>

<label for="network" class="px-4.5 font-bold">{$i18n.send.text.network}:</label>

<div id="network" class="mb-4 mt-1 pt-0.5">
	<Dropdown name="network" bind:selectedValue={networkName}>
		<option disabled selected value={undefined} class="hidden"
			><span class="description">{$i18n.send.placeholder.select_network}</span></option
		>
		<DropdownItem value={ETHEREUM_NETWORK.name}>{ETHEREUM_NETWORK.name}</DropdownItem>

		<DropdownItem value={ICP_NETWORK.name}>{$i18n.send.text.convert_to_native_icp}</DropdownItem>
	</Dropdown>
</div>

<style lang="scss">
	.hidden {
		display: none;
	}
</style>

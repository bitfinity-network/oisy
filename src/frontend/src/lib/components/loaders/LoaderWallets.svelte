<script lang="ts">
	import BtcLoaderWallets from '$btc/components/core/BtcLoaderWallets.svelte';
	import IcLoaderWallets from '$icp/components/core/IcLoaderWallets.svelte';
	import BtfBridgeWorker from '../../../btf/components/core/BtfBridgeWorker.svelte';
</script>

<IcLoaderWallets>
	<BtcLoaderWallets>
		<BtfBridgeWorker>
			<slot />
		</BtfBridgeWorker>
	</BtcLoaderWallets>
</IcLoaderWallets>

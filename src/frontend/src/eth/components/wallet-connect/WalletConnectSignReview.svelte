<script lang="ts">
	import { nonNullish } from '@dfinity/utils';
	import type { Web3WalletTypes } from '@walletconnect/web3wallet';
	import WalletConnectActions from '$eth/components/wallet-connect/WalletConnectActions.svelte';
	import {
		getSignParamsMessageUtf8,
		getSignParamsMessageHex
	} from '$eth/utils/wallet-connect.utils';
	import ContentWithToolbar from '$lib/components/ui/ContentWithToolbar.svelte';
	import Json from '$lib/components/ui/Json.svelte';
	import { i18n } from '$lib/stores/i18n.store';

	export let request: Web3WalletTypes.SessionRequest;

	let message: string;
	$: message = getSignParamsMessageHex(request.params.request.params);

	let json: unknown | undefined;
	$: (() => {
		try {
			json = JSON.parse(message);
		} catch (_err: unknown) {
			json = undefined;
		}
	})();
</script>

<ContentWithToolbar>
	<p class="mb-0 font-bold">{$i18n.wallet_connect.text.method}:</p>
	<p class="mb-4 font-normal">
		{request.params.request.method}
	</p>

	<p class="mb-0.5 font-bold">{$i18n.wallet_connect.text.message}:</p>
	{#if nonNullish(json)}
		<div class="mt-4 rounded-sm bg-dust p-4">
			<Json {json} _collapsed={true} />
		</div>
	{:else}
		<p class="mb-4 font-normal">
			<output class="break-all">{getSignParamsMessageUtf8(request.params.request.params)}</output>
		</p>
	{/if}

	<WalletConnectActions on:icApprove on:icReject slot="toolbar" />
</ContentWithToolbar>

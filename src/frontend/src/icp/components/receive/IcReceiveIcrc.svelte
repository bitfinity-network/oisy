<script lang="ts">
	import { getContext } from 'svelte';
	import IcReceiveInfoIcrc from '$icp/components/receive/IcReceiveInfoIcrc.svelte';
	import {
		RECEIVE_TOKEN_CONTEXT_KEY,
		type ReceiveTokenContext
	} from '$icp/stores/receive-token.store';
	import ReceiveAddressModal from '$lib/components/receive/ReceiveAddressModal.svelte';
	import ReceiveButtonWithModal from '$lib/components/receive/ReceiveButtonWithModal.svelte';
	import { modalIcrcReceive } from '$lib/derived/modal.derived';
	import { modalStore } from '$lib/stores/modal.store';

	const { open, close } = getContext<ReceiveTokenContext>(RECEIVE_TOKEN_CONTEXT_KEY);

	const openReceive = (modalId: symbol) => {
		modalStore.openIcrcReceive(modalId);
	};

	const openModal = async (modalId: symbol) => await open(async () => await openReceive(modalId));
</script>

<ReceiveButtonWithModal open={openModal} isOpen={$modalIcrcReceive}>
	<ReceiveAddressModal infoCmp={IcReceiveInfoIcrc} on:nnsClose={close} slot="modal" />
</ReceiveButtonWithModal>

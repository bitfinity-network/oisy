<script lang="ts">
	import { nonNullish } from '@dfinity/utils';
	import { slide } from 'svelte/transition';
	import LoaderEthTransactions from '$eth/components/loaders/LoaderEthTransactions.svelte';
	import TokenModal from '$eth/components/tokens/TokenModal.svelte';
	import EthTransaction from '$eth/components/transactions/EthTransaction.svelte';
	import EthTransactionModal from '$eth/components/transactions/EthTransactionModal.svelte';
	import EthTransactionsSkeletons from '$eth/components/transactions/EthTransactionsSkeletons.svelte';
	import { sortedEthTransactions } from '$eth/derived/eth-transactions.derived';
	import { ethereumTokenId, ethereumToken } from '$eth/derived/token.derived';
	import type { EthTransactionUi } from '$eth/types/eth-transaction';
	import { mapEthTransactionUi } from '$eth/utils/transactions.utils';
	import { ckEthMinterInfoStore } from '$icp-eth/stores/cketh.store';
	import { toCkMinterInfoAddresses } from '$icp-eth/utils/cketh.utils';
	import TransactionsPlaceholder from '$lib/components/transactions/TransactionsPlaceholder.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import { SLIDE_DURATION } from '$lib/constants/transition.constants';
	import { ethAddress } from '$lib/derived/address.derived';
	import { modalToken, modalEthTransaction } from '$lib/derived/modal.derived';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import { i18n } from '$lib/stores/i18n.store';
	import { modalStore } from '$lib/stores/modal.store';
	import type { OptionEthAddress } from '$lib/types/address';
	import type { OptionToken } from '$lib/types/token';
	import type { Transaction as TransactionType } from '$lib/types/transaction';
	import { mapTransactionModalData } from '$lib/utils/transaction.utils';
	import { onMount } from 'svelte';
	import { emit } from '$lib/utils/events.utils';
	import { isOBTCToken } from '$lib/utils/token.utils';

	let ckMinterInfoAddresses: OptionEthAddress[] = [];
	$: ckMinterInfoAddresses = toCkMinterInfoAddresses({
		minterInfo: $ckEthMinterInfoStore?.[$ethereumTokenId],
		networkId: $ethereumToken.network.id
	});

	let sortedTransactionsUi: EthTransactionUi[];
	$: sortedTransactionsUi = $sortedEthTransactions.map((transaction) =>
		mapEthTransactionUi({
			transaction,
			ckMinterInfoAddresses,
			$ethAddress: $ethAddress
		})
	);

	let selectedTransaction: TransactionType | undefined;
	let selectedToken: OptionToken;
	$: ({ transaction: selectedTransaction, token: selectedToken } =
		mapTransactionModalData<TransactionType>({
			$modalOpen: $modalEthTransaction,
			$modalStore: $modalStore
		}));

	onMount(() => {
		if (isOBTCToken($tokenWithFallback) && $ethAddress) {
			emit({
				message: 'btfBridgeStart',
				detail: { targetAddress: $ethAddress }
			});
		}
	});
</script>

<Header>{$i18n.transactions.text.title}</Header>

<LoaderEthTransactions>
	<EthTransactionsSkeletons>
		{#each sortedTransactionsUi as transaction (transaction.hash)}
			<div transition:slide={SLIDE_DURATION}>
				<EthTransaction {transaction} token={$tokenWithFallback} />
			</div>
		{/each}

		{#if $sortedEthTransactions.length === 0}
			<TransactionsPlaceholder />
		{/if}
	</EthTransactionsSkeletons>
</LoaderEthTransactions>

{#if $modalEthTransaction && nonNullish(selectedTransaction)}
	<EthTransactionModal transaction={selectedTransaction} token={selectedToken} />
{:else if $modalToken}
	<TokenModal />
{/if}

<script lang="ts">
	import { WizardModal, type WizardStep, type WizardSteps, IconWarning } from '@dfinity/gix-components';
	import { i18n } from '$lib/stores/i18n.store';
	import { modalStore } from '$lib/stores/modal.store';
	import Button from '$lib/components/ui/Button.svelte';
	import ButtonGroup from '$lib/components/ui/ButtonGroup.svelte';
	import { authSignedIn } from '$lib/derived/auth.derived';

	let visible = true;
	const close = () => (visible = false);

	const steps: WizardSteps = [
		{
			name: 'Warning',
			title: 'Important Security Notice'
		}
	];

	let currentStep: WizardStep | undefined;
	let modal: WizardModal;
</script>

{#if visible && $authSignedIn}
	<WizardModal {steps} bind:currentStep bind:this={modal} on:nnsClose={close}>
		<svelte:fragment slot="title">Important Security Notice</svelte:fragment>

		<div class="flex flex-col gap-6 p-6">
			<div class="flex items-center gap-4 text-warning">
				<IconWarning size="48px" />
				<div class="flex flex-col gap-2">
					<p class="text-base">
						This fork of Oisy UI is under development. Please be careful with sending digital assets.
					</p>
				</div>
			</div>

			<ButtonGroup>
				<Button colorStyle="primary" type="button" fullWidth on:click={close}>
					I understand, proceed with caution
				</Button>
			</ButtonGroup>
		</div>
	</WizardModal>
{/if} 
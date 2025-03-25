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

<style lang="scss">
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: calc(var(--overlay-z-index) + 10);
	}

	.popup {
		background: white;
		padding: var(--padding-3x);
		border-radius: var(--border-radius);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
		width: 90%;
		max-width: 500px;
		animation: popup 0.3s ease-out;
	}

	@keyframes popup {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
</style> 
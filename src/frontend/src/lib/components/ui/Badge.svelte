<script lang="ts">
	export let styleClass: string | undefined = undefined;

	const variantClassNames = {
		default: 'border border-tertiary bg-dust/30',
		info: 'bg-brand-subtle text-brand-primary',
		error: 'bg-error-subtle text-error',
		warning: 'bg-warning-subtle text-warning',
		success: 'bg-success-subtle text-success',
		outline: 'border border-tertiary bg-off-white'
	};

	export let variant: keyof typeof variantClassNames = 'default';
</script>

<span
	class="inline-flex h-fit w-full items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold {variantClassNames[
		variant
	]} {styleClass ?? ''}"
>
	<span class="inline-block min-w-0 truncate">
		<slot />
	</span>
</span>

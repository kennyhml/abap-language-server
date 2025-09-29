<script lang="ts">
	let { value = $bindable(), showRequired = $bindable(), ...props } = $props();
</script>

<input bind:value {...props} class={{ missingValue: showRequired && !value }} />

<style>
	input {
		background-color: var(--vscode-input-background);
		color: var(--vscode-input-foreground);
		border: 1px solid var(--vscode-dropdown-border);
	}

	.missingValue {
		border: 1px solid red;
	}

	input:focus {
		border-color: var(--vscode-inputOption-activeBorder);
		outline: none;
	}
</style>

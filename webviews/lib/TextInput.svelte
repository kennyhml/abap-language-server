<script lang="ts">
	let { value = $bindable(), ...props } = $props();
</script>

<input bind:value {...props} />

<style>
	input {
		background-color: var(--vscode-input-background);
		color: var(--vscode-input-foreground);
		border: 1px solid var(--vscode-dropdown-border);
	}

	input:focus {
		border-color: var(--vscode-inputOption-activeBorder);
		outline: none;
	}
</style>

<script lang="ts">
	let { selectedValue = $bindable(), options, ...props } = $props();
</script>

<select class="codicon" {...props} bind:value={selectedValue}>
	{#each options as option}
		<option value={option.value}>{option.name}</option>
	{/each}
</select>

<style>
	select {
		color: 1px solid var(--vscode-dropdown-foreground);
		border-color: var(--vscode-dropdown-border);
		border-style: solid;

		cursor: pointer;
		padding: 1px 32px 1px 3px;

		background-color: var(--vscode-dropdown-background);
		background-image: url(../assets/arrow-down.svg);
		background-repeat: no-repeat;
		background-position: 98% 50%;
		background-size: 12px;

		-moz-appearance: none;
		-webkit-appearance: none;
		appearance: none;
		width: auto;
		min-width: 100px;
		outline: none;
	}

	select option {
		background-color: var(--vscode-editor-background);
	}

	select:open,
	select:hover {
		border-color: var(--vscode-inputOption-activeBorder);
	}
</style>

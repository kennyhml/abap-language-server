<script lang="ts">
	let { value = $bindable() } = $props();
</script>

<select class="codicon">
	<option value="option1">Option 1</option>
	<option value="option2">Option 2</option>
	<option value="option3">Option 3</option>
</select>

<style>
	select {
		color: 1px solid var(--vscode-dropdown-foreground);
		border-color: var(--vscode-dropdown-border);
		border-radius: 3px;
		border-style: solid;

		cursor: pointer;
		padding: 3px 32px 3px 12px;

		background-color: var(--vscode-dropdown-background);
		background-image: url(../assets/arrow-down.svg);
		background-repeat: no-repeat;
		background-position: 93% 50%;
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

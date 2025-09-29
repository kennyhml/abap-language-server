<!--
  @component VSCheckBox

  A Check Box Element that suits the VS Code UI Theme using
  the vscode provided style variables.
-->
<script lang="ts">
	let { value = $bindable(), ...props } = $props();
</script>

<button
	type="button"
	aria-label="Checkbox"
	class:checked={value}
	{...props}
	onclick={() => {
		value = !value;
	}}
>
</button>

<style>
	button {
		background-position: center;
		background-repeat: no-repeat;
		background-size: contain;
		background-color: var(--vscode-checkbox-background);
		border: 1px solid var(--vscode-checkbox-border);
		width: 20px;
		height: 20px;
	}

	button:active {
		border-color: var(--vscode-inputOption-activeBorder);
	}

	button:hover {
		background-color: var(--vscode-inputOption-hoverBackground);
	}

	.checked {
		background-image: url(../../assets/checkmark.svg);
	}
</style>

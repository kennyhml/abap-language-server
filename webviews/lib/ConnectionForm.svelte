<script lang="ts">
	import Dropdown from './Dropdown.svelte';
	import TextInput from './TextInput.svelte';

	const connectionTypes = [
		{
			value: 'group',
			name: 'Group Selection',
		},
		{
			value: 'custom',
			name: 'Custom Application Server',
		},
	];

	const sncLevels = [
		{
			value: 'highest',
			name: 'Highest available security level',
		},
		{
			value: 'encrypted',
			name: 'Encryption ensured',
		},
		{
			value: 'signed',
			name: 'Integrity ensured',
		},
		{
			value: 'authed',
			name: 'User agent authentication ensured',
		},
	];

	let connectionType = $state('group');
	let sncLevel = $state('highest');
</script>

<section class="container">
	<section style="width: 100%">
		<header>
			<h3 class="config-header">Connection Parameters</h3>
		</header>
		<div class="input-group">
			<div class="input-row">
				<label class="label" for="">System ID*</label>
				<TextInput style="flex-grow: 1" />
			</div>
			<div class="input-row">
				<label class="label" for="">Connection Type</label>
				<Dropdown
					bind:selectedValue={connectionType}
					options={connectionTypes}
					style="flex-grow: 1"
				></Dropdown>
			</div>

			{#if connectionType === 'group'}
				<div class="input-row">
					<label class="label" for="">Message Server*</label>
					<TextInput style="flex-grow: 1" />
				</div>
				<div class="input-row">
					<label class="label" for="">Group*</label>
					<TextInput style="flex-grow: 1" />
				</div>
				<div class="input-row">
					<label class="label" for="">Message Server Port</label>
					<TextInput style="flex-grow: 1" />
				</div>
			{:else}
				<div class="input-row">
					<label class="label" for="">Application Server*</label>
					<TextInput style="flex-grow: 1" />
				</div>
				<div class="input-row">
					<label class="label" for="">Instance Number*</label>
					<TextInput style="flex-grow: 1" />
				</div>
				<div class="input-row">
					<label class="label" for="">RFC Gateway Server</label>
					<TextInput style="flex-grow: 1" />
				</div>
				<div class="input-row">
					<label class="label" for="">RFC Gateway Server Port</label>
					<TextInput style="flex-grow: 1" />
				</div>
			{/if}
			<div class="input-row">
				<label class="label" for="">SAProuter Connection String</label>
				<TextInput style="flex-grow: 1" />
			</div>
		</div>
	</section>

	<section style="width: 100%;">
		<header>
			<h3 class="config-header">Secure Network Settings</h3>
		</header>
		<div class="input-group">
			<!--TODO: Enabled or not?-->

			<div class="input-row">
				<label class="label" for="">SNC Security Level</label>
				<Dropdown
					bind:selectedValue={sncLevel}
					options={sncLevels}
					style="flex-grow: 1"
				></Dropdown>
			</div>

			<div class="input-row">
				<label class="label" for="">SNC Name*</label>
				<TextInput style="flex-grow: 1" />
			</div>
		</div>
	</section>

	<section style="width: 100%;">
		<header>
			<h3 class="config-header">Connection Properties</h3>
		</header>
		<div class="input-group">
			<div class="input-row">
				<label class="label" for="">Save Connection as</label>
				<TextInput style="flex-grow: 1" />
			</div>

			<div class="input-row">
				<label class="label" for="">Default Client Number</label>
				<TextInput style="flex-grow: 1" />
			</div>

			<div class="input-row">
				<label class="label" for="">Default Client Language</label>
				<TextInput style="flex-grow: 1" />
			</div>
		</div>
	</section>
	<footer class="buttons">
		<button type="button">Save Connection</button>
		<button type="submit" class="secondary">Test Connection</button>
	</footer>
</section>

<style>
	.buttons {
		display: flex;
		flex-direction: row;
		gap: 40px;
		width: 100%;
		height: 100%;
		margin-bottom: 3px;
		justify-content: space-between;
		align-items: end;
	}

	.buttons button {
		border-radius: 2px;
		background-color: var(--vscode-button-background);
		border: 1px solid var(--vscode-button-border);
		color: var(--vscode-button-foreground);
		padding: 4px 10px;
		text-transform: uppercase;
		font-weight: bold;
	}

	.buttons button.secondary {
		background-color: var(--vscode-button-secondaryBackground);
		color: var(--vscode-button-secondaryForeground);
	}

	button:focus,
	button:focus-visible {
		outline: 1px solid var(--vscode-focusBorder);
		outline-offset: 2px;
	}

	.buttons button:active {
		border: var(--vscode-focusBorder);
	}

	.buttons button:hover {
		background-color: var(--vscode-button-hoverBackground);
	}

	.buttons button.secondary:hover {
		background-color: var(--vscode-button-secondaryHoverBackground);
	}

	.container {
		display: flex;
		flex-direction: column;
		gap: 30px;

		width: 100%;
		height: 73vh;
	}

	.config-header {
		margin-top: 0;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.input-row {
		display: flex;
		align-items: center;
	}

	.label {
		text-align: left;
		min-width: 180px;
	}
</style>

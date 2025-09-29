<script lang="ts">
	import Dropdown from './Dropdown.svelte';
	import TextInput from './TextInput.svelte';
	import WarningIcon from '../assets/warning.svg';

	import * as connection from 'types/connection';
	import {
		type Connection,
		ConnectionTypes,
		SecurityLevel,
	} from 'types/connection';

	export type SubmissionResult = {
		success: boolean;
		message: string;
	};

	type Props = {
		connectionData: Connection;
		onSubmit: (conn: Connection) => Promise<SubmissionResult>;
		onTest: (conn: Connection) => Promise<SubmissionResult>;
	};

	let { connectionData = $bindable(), onSubmit, onTest }: Props = $props();

	const connectionTypes = [
		{
			value: ConnectionTypes.GroupSelection,
			name: 'Group Selection',
		},
		{
			value: ConnectionTypes.CustomApplicationServer,
			name: 'Custom Application Server',
		},
	];

	const sncLevels = [
		{
			value: SecurityLevel.Highest,
			name: 'Highest available security level',
		},
		{
			value: SecurityLevel.Encrypted,
			name: 'Encryption ensured',
		},
		{
			value: SecurityLevel.Signed,
			name: 'Integrity ensured',
		},
		{
			value: SecurityLevel.Authed,
			name: 'User agent authentication ensured',
		},
	];
</script>

<section class="container">
	<section style="width: 100%">
		<header>
			<h3 class="config-header">Connection Parameters</h3>
		</header>
		<div class="input-group">
			<div class="input-row">
				<label class="label" for="">System ID*</label>
				<TextInput style="flex-grow: 1" bind:value={connectionData.systemId} />
			</div>
			<div class="input-row">
				<label class="label" for="">Connection Type</label>
				<Dropdown
					bind:selectedValue={connectionData.connectionType}
					options={connectionTypes}
					style="flex-grow: 1"
				></Dropdown>
			</div>

			{#if connection.isGroupSelection(connectionData)}
				<div class="input-row">
					<label class="label" for="">Message Server*</label>
					<TextInput
						style="flex-grow: 1"
						bind:value={connectionData.messageServer}
					/>
				</div>
				<div class="input-row">
					<label class="label" for="">Group*</label>
					<TextInput style="flex-grow: 1" bind:value={connectionData.group} />
				</div>
				<div class="input-row">
					<label class="label" for="">Message Server Port</label>
					<TextInput
						style="flex-grow: 1"
						bind:value={connectionData.messageServerPort}
					/>
				</div>
			{:else}
				<div class="input-row">
					<label class="label" for="">Application Server*</label>
					<TextInput
						style="flex-grow: 1"
						bind:value={connectionData.applicationServer}
					/>
				</div>
				<div class="input-row">
					<label class="label" for="">Instance Number*</label>
					<TextInput
						style="flex-grow: 1"
						bind:value={connectionData.instanceNumber}
					/>
				</div>
				<div class="input-row">
					<label class="label" for="">RFC Gateway Server</label>
					<TextInput
						style="flex-grow: 1"
						bind:value={connectionData.rfcGatewayServer}
					/>
				</div>
				<div class="input-row">
					<label class="label" for="">RFC Gateway Server Port</label>
					<TextInput
						style="flex-grow: 1"
						bind:value={connectionData.rfcGatewayServerPort}
					/>
				</div>
			{/if}
			<div class="input-row">
				<label class="label" for="">SAProuter Connection String</label>
				<TextInput
					style="flex-grow: 1"
					bind:value={connectionData.sapRouterString}
				/>
			</div>
		</div>
	</section>

	<section style="width: 100%;">
		<header>
			<h3 class="config-header">Secure Network Settings</h3>
		</header>
		<div class="input-group">
			<div class="input-row">
				<label class="label" for="">SNC Security Level</label>
				<Dropdown
					bind:selectedValue={connectionData.sncLevel}
					options={sncLevels}
					style="flex-grow: 1"
				></Dropdown>
			</div>

			<div class="input-row">
				<label class="label" for="">SNC Name*</label>
				<TextInput style="flex-grow: 1" bind:value={connectionData.sncName} />
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
				<TextInput
					style="flex-grow: 1"
					bind:value={connectionData.displayName}
				/>
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

	<footer>
		{#if connectionData.wasPredefined}
			<div style="display: flex; align-items: center; gap: 8px">
				<img src={WarningIcon} alt="Warning" />
				<span>
					Modifying technical parameters will disable automatic synchronization
					with the landscape provider.
				</span>
			</div>
		{/if}

		<div class="buttons">
			<button
				type="button"
				onclick={() => {
					onSubmit(connectionData);
				}}>Save Connection</button
			>
			<button
				type="submit"
				class="secondary"
				onclick={() => {
					onTest(connectionData);
				}}>Test Connection</button
			>
		</div>
	</footer>
</section>

<style>
	footer {
		margin-top: -8px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		height: 100%;
	}

	footer span {
		color: rgb(223, 223, 38);
	}

	.buttons {
		display: flex;
		flex-direction: row;
		gap: 40px;
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
		gap: 20px;

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

<script lang="ts">
	import Dropdown from './Dropdown.svelte';
	import TextInput from './TextInput.svelte';
	import WarningIcon from '../assets/warning.svg';
	import ErrorIcon from '../assets/error.svg';
	import SystemAddedIcon from '../assets/systemAdded.svg';
	import * as connection from 'types/connection';
	import {
		type Connection,
		type SubmissionResult,
		ConnectionTypes,
		SecurityLevel,
	} from 'types/connection';
	import VSCheckBox from './common/VSCheckBox.svelte';

	type Props = {
		connectionData: Connection;
		onSubmit: (conn: Connection) => Promise<SubmissionResult>;
		onTest: (conn: Connection) => Promise<SubmissionResult>;
	};

	let { connectionData = $bindable(), onSubmit, onTest }: Props = $props();
	let showMissingFields = $state(false);

	let errorMessage = $state('');
	let successMessage = $state('');

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

	/**
	 * Whether all the required fields are filled taking into account
	 * the difference between connection types.
	 * @param data
	 */
	function allRequiredFieldsFilled(data: Connection) {
		if (!data.systemId || (data.sncEnabled && !data.sncName)) {
			return false;
		}
		// Different props required based on the connection type
		if (connection.isApplicationServer(data)) {
			return data.applicationServer && data.instanceNumber;
		} else {
			return data.group && data.messageServer;
		}
	}

	/**
	 * Checks whether all required fields are filled and only then passes
	 * the callback to the outer framework.
	 *
	 * If not all required fields are filled, triggers highlighting on the
	 * missing fields and displays an error message.
	 */
	async function onSubmitButtonPressed() {
		if (!allRequiredFieldsFilled(connectionData)) {
			showMissingFields = true;
			errorMessage = 'Fill in the mandatory connection parameters.';
			successMessage = '';
			return;
		}
		showMissingFields = false;
		errorMessage = '';
		let result = await onSubmit(connectionData);
		console.log('Submission result: ', result);
		if (result.success) {
			connectionData = {
				systemId: '',
				name: '',
				displayName: '',
				description: '',
				connectionType: ConnectionTypes.CustomApplicationServer,
				applicationServer: '',
				instanceNumber: '',
				sapRouterString: '',
				sncEnabled: true,
				ssoEnabled: true,
				sncName: '',
				sncLevel: SecurityLevel.Encrypted,
				keepSynced: false,
				wasPredefined: false,
			};
			successMessage = result.message;
		} else {
			errorMessage = result.message;
		}
	}
</script>

<section class="container">
	<section style="width: 100%">
		<header>
			<h3 class="config-header">Connection Parameters</h3>
		</header>
		<div class="input-group">
			<div class="input-row">
				<label class="label" for="">System ID*</label>
				<TextInput
					style="flex-grow: 1"
					bind:value={connectionData.systemId}
					bind:showRequired={showMissingFields}
				/>
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
						bind:showRequired={showMissingFields}
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
						bind:showRequired={showMissingFields}
					/>
				</div>
				<div class="input-row">
					<label class="label" for="">Instance Number*</label>
					<TextInput
						style="flex-grow: 1"
						bind:value={connectionData.instanceNumber}
						bind:showRequired={showMissingFields}
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
				<label class="label" for="">SNC Enabled</label>
				<VSCheckBox bind:value={connectionData.sncEnabled}></VSCheckBox>
			</div>

			{#if connectionData.sncEnabled}
				<div class="input-row">
					<label class="label" for="">SNC Security Level</label>
					<Dropdown
						bind:selectedValue={connectionData.sncLevel}
						options={sncLevels}
						style="flex-grow: 1"
					></Dropdown>
				</div>

				<div class="input-row">
					<label class="label" for="">SNC Authentication Name*</label>
					<TextInput
						style="flex-grow: 1"
						bind:value={connectionData.sncName}
						bind:showRequired={showMissingFields}
					/>
				</div>

				<div class="input-row">
					<label class="label" for="">Single-Sign-On Enabled</label>
					<VSCheckBox bind:value={connectionData.ssoEnabled}></VSCheckBox>
				</div>
			{/if}
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
				<img src={WarningIcon} alt="Warning" class="messageIcon" />
				<span class="warningMessage">
					Modifying technical parameters will disable automatic synchronization
					with the landscape provider.
				</span>
			</div>
		{/if}

		{#if errorMessage}
			<div style="display: flex; align-items: center; gap: 8px">
				<img src={ErrorIcon} alt="Error" />
				<span class="errorMessage">{errorMessage}</span>
			</div>
		{/if}

		{#if successMessage}
			<div style="display: flex; align-items: center; gap: 8px">
				<img src={SystemAddedIcon} alt="Success" class="messageIcon" />
				<span class="successMessage">{successMessage}</span>
			</div>
		{/if}

		<div class="buttons">
			<button type="button" onclick={onSubmitButtonPressed}
				>Save Connection</button
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
		margin-top: -5px;
		display: flex;
		flex-direction: column;
		gap: 15px;
		height: 100%;
	}

	.messageIcon {
		width: 24px;
		height: 24px;
	}

	.errorMessage {
		color: rgb(255, 41, 41);
	}

	.warningMessage {
		color: rgb(223, 223, 38);
	}

	.successMessage {
		color: rgb(0, 255, 0);
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

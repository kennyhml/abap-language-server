<script lang="ts">
	import Dropdown from './Dropdown.svelte';
	import TextInput from './TextInput.svelte';
	import WarningIcon from '../assets/warning.svg';
	import ErrorIcon from '../assets/error.svg';
	import LoadingIcon from '../assets/loading.svg';
	import SystemAddedIcon from '../assets/systemAdded.svg';
	import {
		type SystemConnection,
		ConnectionType,
		SecurityLevel,
		isRfcConnection,
		isGroupSelection,
		isApplicationServer,
	} from 'extension';
	import VSCheckBox from './common/VSCheckBox.svelte';

	type Props = {
		systemData: SystemConnection;
		onSubmit: (
			system: SystemConnection,
		) => Promise<{ success: boolean; message: string }>;
		onTest: (
			system: SystemConnection,
		) => Promise<{ success: boolean; message: string }>;
	};

	let { systemData = $bindable(), onSubmit, onTest }: Props = $props();
	let showMissingFields = $state(false);

	let errorMessage = $state('');
	let successMessage = $state('');
	let loading = $state(false);

	const connectionTypes = [
		{
			value: ConnectionType.GroupSelection,
			name: 'Group Selection',
		},
		{
			value: ConnectionType.CustomApplicationServer,
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
	function allRequiredFieldsFilled(system: SystemConnection) {
		if (
			system.systemId.length === 0 ||
			system.params.client.length === 0 ||
			system.params.language.length === 0 ||
			system.name.length === 0
		) {
			return false;
		}

		if (isRfcConnection(system.params)) {
			let params = system.params;
			if (!system.systemId || (params.sncEnabled && !params.sncName)) {
				return false;
			}
			// Different props required based on the connection type
			if (isApplicationServer(params)) {
				return params.applicationServer && params.instanceNumber;
			} else {
				return params.group && params.messageServer;
			}
		} else {
			return system.systemId && system.params.hostname && system.params.port;
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
		successMessage = errorMessage = '';
		if (!allRequiredFieldsFilled(systemData)) {
			showMissingFields = true;
			errorMessage = 'Fill in the mandatory connection parameters.';
			return;
		}
		showMissingFields = false;

		let result = await onSubmit(systemData);
		console.log('Submission result: ', result);
		if (result.success) {
			successMessage = result.message;
		} else {
			errorMessage = result.message;
		}
	}

	async function onTestButtonPressed() {
		successMessage = errorMessage = '';
		if (!allRequiredFieldsFilled(systemData)) {
			showMissingFields = true;
			errorMessage = 'Fill in the mandatory connection parameters.';
			return;
		}
		showMissingFields = false;
		loading = true;
		let result = await onTest(systemData);
		loading = false;
		if (result.success) {
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
					bind:value={systemData.systemId}
					bind:showRequired={showMissingFields}
				/>
			</div>
			{#if isRfcConnection(systemData.params)}
				<div class="input-row">
					<label class="label" for="">Connection Type</label>
					<Dropdown
						bind:selectedValue={systemData.params.connectionType}
						options={connectionTypes}
						style="flex-grow: 1"
					></Dropdown>
				</div>

				{#if isGroupSelection(systemData.params)}
					<div class="input-row">
						<label class="label" for="">Message Server*</label>
						<TextInput
							style="flex-grow: 1"
							bind:value={systemData.params.messageServer}
							bind:showRequired={showMissingFields}
						/>
					</div>
					<div class="input-row">
						<label class="label" for="">Group*</label>
						<TextInput
							style="flex-grow: 1"
							bind:value={systemData.params.group}
						/>
					</div>
					<div class="input-row">
						<label class="label" for="">Message Server Port</label>
						<TextInput
							style="flex-grow: 1"
							bind:value={systemData.params.messageServerPort}
						/>
					</div>
				{:else}
					<div class="input-row">
						<label class="label" for="">Application Server*</label>
						<TextInput
							style="flex-grow: 1"
							bind:value={systemData.params.applicationServer}
							bind:showRequired={showMissingFields}
						/>
					</div>
					<div class="input-row">
						<label class="label" for="">Instance Number*</label>
						<TextInput
							style="flex-grow: 1"
							bind:value={systemData.params.instanceNumber}
							bind:showRequired={showMissingFields}
						/>
					</div>
					<div class="input-row">
						<label class="label" for="">RFC Gateway Server</label>
						<TextInput
							style="flex-grow: 1"
							bind:value={systemData.params.rfcGatewayServer}
						/>
					</div>
					<div class="input-row">
						<label class="label" for="">RFC Gateway Server Port</label>
						<TextInput
							style="flex-grow: 1"
							bind:value={systemData.params.rfcGatewayServerPort}
						/>
					</div>
				{/if}
				<div class="input-row">
					<label class="label" for="">SAProuter Connection String</label>
					<TextInput
						style="flex-grow: 1"
						bind:value={systemData.params.sapRouterString}
					/>
				</div>
			{:else}
				<div class="input-row">
					<label class="label" for="">Hostname*</label>
					<TextInput
						style="flex-grow: 1"
						bind:value={systemData.params.hostname}
						bind:showRequired={showMissingFields}
					/>
				</div>
				<div class="input-row">
					<label class="label" for="">Port*</label>
					<TextInput
						style="flex-grow: 1"
						bind:value={systemData.params.port}
						bind:showRequired={showMissingFields}
						type="number"
					/>
				</div>
			{/if}
		</div>
	</section>

	<section style="width: 100%;">
		<header>
			<h3 class="config-header">Secure Connection Settings</h3>
		</header>
		{#if isRfcConnection(systemData.params)}
			<div class="input-group">
				<div class="input-row">
					<label class="label" for="">SNC Enabled</label>
					<VSCheckBox bind:value={systemData.params.sncEnabled}></VSCheckBox>
				</div>

				{#if systemData.params.sncEnabled}
					<div class="input-row">
						<label class="label" for="">SNC Security Level</label>
						<Dropdown
							bind:selectedValue={systemData.params.sncLevel}
							options={sncLevels}
							style="flex-grow: 1"
						></Dropdown>
					</div>

					<div class="input-row">
						<label class="label" for="">SNC Authentication Name*</label>
						<TextInput
							style="flex-grow: 1"
							bind:value={systemData.params.sncName}
							bind:showRequired={showMissingFields}
						/>
					</div>

					<div class="input-row">
						<label class="label" for="">Single-Sign-On Enabled</label>
						<VSCheckBox bind:value={systemData.params.ssoEnabled}></VSCheckBox>
					</div>
				{/if}
			</div>
		{:else}
			<div class="input-group">
				<div class="input-row">
					<label class="label" for="">SSL/TLS Encrypted (HTTPS)</label>
					<VSCheckBox bind:value={systemData.params.ssl}></VSCheckBox>

					{#if !systemData.params.ssl}
						<div
							style="display: flex; align-items: center; gap: 8px; margin-left: 5px"
						>
							<img src={WarningIcon} alt="Warning" class="securityRiskIcon" />
							<span class="warningMessage">HTTPS is strongly recommended</span>
						</div>
					{/if}
				</div>

				{#if systemData.params.ssl}
					<div class="input-row">
						<label class="label" for="">Accept Invalid Certificates</label>
						<VSCheckBox bind:value={systemData.params.acceptInvalidCerts}
						></VSCheckBox>
						{#if systemData.params.acceptInvalidCerts}
							<div
								style="display: flex; align-items: center; gap: 8px; margin-left: 5px"
							>
								<img src={WarningIcon} alt="Warning" class="securityRiskIcon" />
								<span class="warningMessage"
									>Trusting invalid certs poses a security threat.</span
								>
							</div>
						{/if}
					</div>

					<div class="input-row">
						<label class="label" for="">Accept Invalid Hostnames</label>
						<VSCheckBox bind:value={systemData.params.acceptInvalidHostname}
						></VSCheckBox>
						{#if systemData.params.acceptInvalidHostname}
							<div
								style="display: flex; align-items: center; gap: 8px; margin-left: 5px"
							>
								<img src={WarningIcon} alt="Warning" class="securityRiskIcon" />
								<span class="warningMessage"
									>Trusting invalid hostnames poses a security threat.</span
								>
							</div>
						{/if}
					</div>

					<div class="input-row">
						<label class="label" for="">Custom Certificate</label>
						<TextInput
							style="flex-grow: 1"
							bind:value={systemData.params.customCertificate}
						/>
					</div>
				{/if}
			</div>
		{/if}
	</section>

	<section style="width: 100%;">
		<header>
			<h3 class="config-header">Connection Properties</h3>
		</header>
		<div class="input-group">
			<div class="input-row">
				<label class="label" for="">Save Connection as*</label>
				<TextInput
					style="flex-grow: 1"
					bind:showRequired={showMissingFields}
					bind:value={systemData.name}
				/>
			</div>

			<div class="input-row">
				<label class="label" for="">Default Client Number*</label>
				<TextInput
					style="flex-grow: 1"
					bind:value={systemData.params.client}
					bind:showRequired={showMissingFields}
				/>
			</div>

			<div class="input-row">
				<label class="label" for="">Default Client Language*</label>
				<TextInput
					style="flex-grow: 1"
					bind:value={systemData.params.language}
					bind:showRequired={showMissingFields}
				/>
			</div>
		</div>
	</section>

	<footer>
		{#if systemData.landscapeProviderUrl}
			<div style="display: flex; align-items: center; gap: 8px">
				<img src={WarningIcon} alt="Warning" class="messageIcon" />
				<span class="warningMessage">
					Modifying technical parameters disables automatic synchronization with
					the landscape provider.
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

		{#if loading}
			<div style="display: flex; align-items: center; gap: 8px">
				<img src={LoadingIcon} alt="Loading" class="messageIcon" />
				<span class="loadingMessage">Testing Connection...</span>
			</div>
		{/if}

		<div class="buttons">
			<button type="button" onclick={onSubmitButtonPressed}
				>Save Connection</button
			>
			<button type="submit" class="secondary" onclick={onTestButtonPressed}
				>Test Connection</button
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

	.securityRiskIcon {
		margin-left: 5px;
		width: 20px;
		height: 20px;
	}

	.errorMessage {
		color: rgb(251, 37, 37);
		font-weight: bold;
	}

	.loadingMessage {
		color: #0db8df;
		font-weight: bold;
	}

	.warningMessage {
		color: rgb(223, 223, 38);
		font-weight: bold;
	}

	.successMessage {
		color: rgb(0, 255, 0);
		font-weight: bold;
	}

	.buttons {
		display: flex;
		flex-direction: row;
		gap: 40px;
		height: 100%;
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

		position: relative;
		width: 100%;
		order: 0;
		flex: 1 1 auto;
		align-self: stretch;
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

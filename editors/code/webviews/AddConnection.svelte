<script lang="ts">
	import {
		type System,
		type LandscapeSystem,
		type SubmissionResult,
		ConnectionProtocols,
		type ConnectionProtocol,
		DEFAULT_HTTP_SYSTEM,
		DEFAULT_RFC_SYSTEM,
	} from 'connections';

	import { onMount } from 'svelte';
	import SystemForm from './lib/SystemForm.svelte';
	import SystemLandscape from './lib/SystemLandscape.svelte';

	let vscode = acquireVsCodeApi();

	let selectedProtocol: ConnectionProtocol = $state(ConnectionProtocols.HTTP);
	let landscapeSystems: LandscapeSystem[] = $state([]);
	let systemData: System = $state(DEFAULT_HTTP_SYSTEM);

	async function onRefreshLandscape() {
		landscapeSystems = await getAvailableConnections();
	}

	function getAvailableConnections(): Promise<LandscapeSystem[]> {
		let interactionId = Math.random().toString(36).substring(2);
		vscode.postMessage({
			type: 'getConnections',
			interactionId,
		});

		return new Promise((resolve, reject) => {
			const handleMessage = (event: MessageEvent<any>) => {
				if (event.data?.interactionId !== interactionId) {
					return;
				}
				window.removeEventListener('message', handleMessage);
				resolve(event.data?.data as LandscapeSystem[]);
			};
			window.addEventListener('message', handleMessage);

			setTimeout(() => {
				window.removeEventListener('message', handleMessage);
				reject(new Error('No response received from extension'));
			}, 5000);
		});
	}

	function onConnectionSubmitted(system: System): Promise<SubmissionResult> {
		let interactionId = Math.random().toString(36).substring(2);
		vscode.postMessage({
			type: 'onSubmit',
			connection: JSON.stringify(system),
			interactionId,
		});

		return new Promise((resolve, reject) => {
			const handleMessage = (event: MessageEvent<any>) => {
				if (event.data?.interactionId !== interactionId) {
					return;
				}
				window.removeEventListener('message', handleMessage);
				resolve(event.data as SubmissionResult);
			};
			window.addEventListener('message', handleMessage);

			setTimeout(() => {
				window.removeEventListener('message', handleMessage);
				reject(new Error('No response received from extension'));
			}, 5000);
		});
	}

	function onConnectionTestRequested(
		system: System,
	): Promise<SubmissionResult> {
		let interactionId = Math.random().toString(36).substring(2);
		vscode.postMessage({
			type: 'onTest',
			connection: JSON.stringify(system),
			interactionId,
		});

		return new Promise((resolve, reject) => {
			const handleMessage = (event: MessageEvent<any>) => {
				if (event.data?.interactionId !== interactionId) {
					return;
				}
				window.removeEventListener('message', handleMessage);
				resolve(event.data as SubmissionResult);
			};
			window.addEventListener('message', handleMessage);

			setTimeout(() => {
				window.removeEventListener('message', handleMessage);
				reject(new Error('No response received from extension'));
			}, 10_000);
		});
	}

	function onSelectionChange(system: LandscapeSystem) {
		systemData = {
			connection: system.connection,
			systemId: system.systemId,
			defaultClient: '001',
			defaultLanguage: 'en',
			description: system.description,
			displayName: system.name,
			landscapeProviderUrl: '/land/scape/provider/',
		};
	}

	function onProtocolChange(protocol: ConnectionProtocol) {
		if (protocol === selectedProtocol) {
			return;
		}
		selectedProtocol = protocol;
		if (selectedProtocol === ConnectionProtocols.HTTP) {
			systemData = DEFAULT_HTTP_SYSTEM;
		} else {
			systemData = DEFAULT_RFC_SYSTEM;
		}
	}

	onMount(async () => {
		try {
			//   connections = await getAvailableConnections();
		} catch (err) {}
	});
</script>

<main>
	<section class="protocolSwitch">
		<button
			class:active={selectedProtocol === ConnectionProtocols.HTTP}
			onclick={() => onProtocolChange(ConnectionProtocols.HTTP)}>HTTP</button
		>
		<!--RFC not supported for now-->
		<button
			class:active={selectedProtocol === ConnectionProtocols.RFC}
			onclick={() => onProtocolChange(ConnectionProtocols.RFC)}>RFC</button
		>
	</section>

	<section class="panels">
		<section class="predefined-connections">
			<h2 class="table-title">Automatically detected Systems</h2>
			<span>
				SAP Logon system connections are detected from the installation files or
				a <a href="https://github.com/kennyhml" target="_blank"
					>manually specified location</a
				>.
			</span>
			<hr />
			<SystemLandscape
				bind:systems={landscapeSystems}
				bind:protocol={selectedProtocol}
				{onSelectionChange}
				{onRefreshLandscape}
			></SystemLandscape>
		</section>

		<section class="custom-connection">
			<h2 class="table-title">Customize Connection</h2>
			<span>
				Create a new connection from scratch or modify an existing connection
				from the provided selection.
			</span>
			<hr />
			<SystemForm
				bind:systemData
				onSubmit={onConnectionSubmitted}
				onTest={onConnectionTestRequested}
			></SystemForm>
		</section>
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		margin: 25px 20px;
		gap: 10px;
	}

	.protocolSwitch {
		display: flex;
		flex-direction: row;
		gap: 1px;
	}

	.protocolSwitch button {
		width: 100px;
		height: 25px;
		text-transform: uppercase;
		font-weight: bold;

		border-radius: 2px;
		background-color: var(--vscode-button-secondaryBackground);
		border: 1px solid var(--vscode-button-secondaryborder);
		color: var(--vscode-button-secondaryForeground);
		padding: 4px 10px;
	}

	.protocolSwitch .active {
		background-color: var(--vscode-button-background);
	}

	.protocolSwitch button:not(.active):hover {
		background-color: var(--vscode-button-secondaryHoverBackground);
	}

	.panels {
		display: flex;
		gap: 50px;
	}

	hr {
		border: none;
		height: 1px;
		background-color: var(--vscode-menu-separatorBackground);
		margin: 16px 0;
	}

	.predefined-connections {
		flex: 1.3 1 0;
		display: flex;
		flex-direction: column;
		height: 90vh;
	}

	.custom-connection {
		flex: 1 1 0;
		display: flex;
		flex-direction: column;
		height: 90vh;
	}

	.table-title {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--vscode-editor-foreground);
		font-family: Arial, sans-serif;
		text-align: left;
	}

	@media (max-width: 1000px) {
		.panels {
			flex-direction: column;
		}
	}
</style>

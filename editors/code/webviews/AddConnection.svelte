<script lang="ts">
	import {
		type SystemConnection,
		type LandscapeSystem,
		ConnectionProtocol,
		DEFAULT_HTTP_SYSTEM,
		DEFAULT_RFC_SYSTEM,
		type ConnectionPanelMessages,
		MessageChannel,
	} from 'extension';

	import { onMount } from 'svelte';
	import SystemForm from './lib/SystemForm.svelte';
	import SystemLandscape from './lib/SystemLandscape.svelte';

	let vscode = acquireVsCodeApi();
	let messageChannel = new MessageChannel<ConnectionPanelMessages>({
		dispatch: vscode.postMessage,
		listen: (listener) =>
			window.addEventListener('message', (event) => listener(event.data)),
	});

	let selectedProtocol: ConnectionProtocol = $state(ConnectionProtocol.Http);
	let landscapeSystems: LandscapeSystem[] = $state([]);
	let systemData: SystemConnection = $state(DEFAULT_HTTP_SYSTEM);

	$inspect(landscapeSystems, console.log);

	async function onRefreshLandscape() {
		landscapeSystems = await getAvailableConnections();
	}

	function getAvailableConnections(): Promise<LandscapeSystem[]> {
		return messageChannel.send('getLandscape', { protocol: selectedProtocol });
	}

	function onConnectionSubmitted(
		connection: SystemConnection,
	): Promise<{ success: boolean; message: string }> {
		return messageChannel.send('connectionSubmit', { connection });
	}

	function onConnectionTestRequested(
		connection: SystemConnection,
	): Promise<{ success: boolean; message: string }> {
		return messageChannel.send('connectionSubmit', { connection, test: true });
	}

	function onSelectionChange(system: LandscapeSystem) {
		systemData = {
			name: system.name,
			systemId: system.systemId,
			description: system.description,
			params: {
				...system.params,
				client: '001',
				language: 'en',
			},
			landscapeProviderUrl: '/land/scape/provider/',
		};
	}

	function onProtocolChange(protocol: ConnectionProtocol) {
		if (protocol === selectedProtocol) {
			return;
		}
		selectedProtocol = protocol;
		if (selectedProtocol === ConnectionProtocol.Http) {
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
			class:active={selectedProtocol === ConnectionProtocol.Http}
			onclick={() => onProtocolChange(ConnectionProtocol.Http)}>HTTP</button
		>
		<!--RFC not supported for now-->
		<button
			class:active={selectedProtocol === ConnectionProtocol.Rfc}
			onclick={() => onProtocolChange(ConnectionProtocol.Rfc)}>RFC</button
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

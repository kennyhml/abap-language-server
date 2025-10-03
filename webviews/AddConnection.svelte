<script lang="ts">
	import {
		type System,
		type LandscapeSystem,
		type SubmissionResult,
		ConnectionProtocols,
	} from 'connections';

	import { onMount } from 'svelte';
	import SystemForm from './lib/SystemForm.svelte';
	import SystemLandscape from './lib/SystemLandscape.svelte';

	let vscode = acquireVsCodeApi();

	let landscapeSystems: LandscapeSystem[] = $state([]);
	let systemData: System = $state({
		connection: {
			kind: ConnectionProtocols.HTTP,
			params: {
				url: '',
				port: 8000,
			},
		},
		systemId: '',
		defaultClient: '001',
		defaultLanguage: 'en',
		description: '',
		displayName: '',
	});

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
		console.log(system);
		return {} as Promise<SubmissionResult>;
	}

	function onSelectionChange(system: LandscapeSystem) {
		systemData = {
			connection: system.connection,
			systemId: system.systemId,
			defaultClient: '001',
			defaultLanguage: 'en',
			description: system.description,
			displayName: system.name,
		};
	}

	onMount(async () => {
		try {
			//   connections = await getAvailableConnections();
		} catch (err) {}
	});
</script>

<main class="container">
	<section class="predefined-connections">
		<h2 class="table-title">Automatically detected Systems</h2>
		<span>
			SAP Logon system connections are detected from the installation files or a <a
				href="https://github.com/kennyhml"
				target="_blank">manually specified location</a
			>.
		</span>
		<hr />
		<SystemLandscape
			bind:systems={landscapeSystems}
			{onSelectionChange}
			{onRefreshLandscape}
		></SystemLandscape>
	</section>

	<section class="custom-connection">
		<h2 class="table-title">Customize Connection</h2>
		<p>
			Create a new connection from scratch or modify an existing connection from
			the provided selection.
		</p>
		<hr />
		<SystemForm
			bind:systemData
			onSubmit={onConnectionSubmitted}
			onTest={onConnectionTestRequested}
		></SystemForm>
	</section>
</main>

<style>
	.container {
		display: flex;
		margin: 40px 20px;
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
		height: 91vh;
	}

	.custom-connection {
		flex: 1 1 0;
		height: 91vh;
	}

	.table-title {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--vscode-editor-foreground);
		font-family: Arial, sans-serif;
		text-align: left;
	}

	@media (max-width: 1000px) {
		.container {
			flex-direction: column;
		}
	}
</style>

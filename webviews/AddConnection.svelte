<script lang="ts">
	import {
		ConnectionTypes,
		SecurityLevel,
		type Connection,
	} from 'types/connection';
	import ConnectionForm, {
		type SubmissionResult,
	} from './lib/ConnectionForm.svelte';
	import ConnectionList from './lib/ConnectionList.svelte';

	let vscode = acquireVsCodeApi();

	let connections: Connection[] = $state([]);
	let formConnectionData: Connection = $state({
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
		keepSynced: true,
		wasPredefined: false,
	});

	function onConnectionSubmitted(conn: Connection): Promise<SubmissionResult> {
		let interactionId = Math.random().toString(36).substring(2);
		vscode.postMessage({
			type: 'onSubmit',
			connection: JSON.stringify(conn),
			interactionId,
		});

		return new Promise((resolve, reject) => {
			const handleMessage = (event: MessageEvent<any>) => {
				if (event.data?.interactionId !== interactionId) {
					return;
				}
				window.removeEventListener('message', handleMessage);
				console.log('Got a reply: ', event.data);
				resolve(event.data as SubmissionResult);
			};

			window.addEventListener('message', handleMessage);

			setTimeout(() => {
				window.removeEventListener('message', handleMessage);
				reject(new Error('No response received from webview'));
			}, 5000);
		});
	}

	function onConnectionTestRequested(
		conn: Connection,
	): Promise<SubmissionResult> {
		console.log(conn);
		return {} as Promise<SubmissionResult>;
	}

	function onSelectionChange(connection: Connection) {
		formConnectionData = connection;
	}

	window.addEventListener('message', (event: any) => {
		if (event.data?.type === 'init') {
			connections = event.data.data.connections as Connection[];
		}
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
		<ConnectionList bind:connections {onSelectionChange}></ConnectionList>
	</section>

	<section class="custom-connection">
		<h2 class="table-title">Customize Connection</h2>
		<p>
			Create a new connection from scratch or modify an existing connection from
			the provided selection.
		</p>
		<hr />
		<ConnectionForm
			bind:connectionData={formConnectionData}
			onSubmit={onConnectionSubmitted}
			onTest={onConnectionTestRequested}
		></ConnectionForm>
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
	}

	.custom-connection {
		flex: 1 1 0;
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

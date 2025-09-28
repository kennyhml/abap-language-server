<script lang="ts">
	import {
		ConnectionTypes,
		SecurityLevel,
		type Connection,
	} from 'types/connection';
	import ConnectionForm from './lib/ConnectionForm.svelte';
	import ConnectionList from './lib/ConnectionList.svelte';

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
	});

	function onSelectionChange(connection: Connection) {
		formConnectionData = connection;
	}

	window.addEventListener('message', (event: any) => {
		if (event.data?.type === 'init') {
			connections = event.data.data.connections as Connection[];
			console.log('Connections updated.');
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
		<ConnectionForm bind:connectionData={formConnectionData}></ConnectionForm>
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

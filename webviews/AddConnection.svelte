<script lang="ts">
	import {
		ConnectionTypes,
		SecurityLevel,
		type Connection,
	} from 'types/connection';
	import ConnectionForm from './lib/ConnectionForm.svelte';
	import ConnectionList from './lib/ConnectionList.svelte';

	let height = $state(70);

	let connections: Connection[] = $state([]);

	let formConnectionData: Connection = $state({
		systemId: 'W4D',
		name: 'W4D Logistics',
		displayName: 'W4D',
		description: 'This is a great system yes many fun here',
		connectionType: ConnectionTypes.CustomApplicationServer,
		applicationServer: 'test',
		instanceNumber: '00',
		sapRouterString: 'This is a router string nobody understands',
		sncEnabled: true,
		ssoEnabled: true,
		sncName: '',
		sncLevel: SecurityLevel.Encrypted,
	});

	function onSelectionChange(connection: Connection) {
		formConnectionData = connection;
	}

	$effect(() => {
		const mediaQuery = window.matchMedia('(max-width: 1000px)');

		const updateHeight = () => {
			height = mediaQuery.matches ? 30 : 70;
		};

		updateHeight();
		mediaQuery.addEventListener('change', updateHeight);

		return () => mediaQuery.removeEventListener('change', updateHeight);
	});

	for (let i = 0; i < 40; i++) {
		connections.push({
			description: 'Test ' + i,
			...formConnectionData,
		});
	}
	connections[4].sncEnabled = false;
	connections[4].ssoEnabled = false;
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
		<ConnectionList {connections} {onSelectionChange}></ConnectionList>
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

<script lang="ts">
	import {
		ConnectionTypes,
		SecurityLevel,
		type Connection,
	} from 'types/connection';
	import ConnectionForm from './lib/ConnectionForm.svelte';
	import ConnectionList, { type System } from './lib/ConnectionList.svelte';

	let height = $state(70);

	let systems: System[] = $state([]);

	let mockConnectionData: Connection = {
		systemId: 'W4D',
		connectionType: ConnectionTypes.CustomApplicationServer,
		applicationServer: 'test',
		instanceNumber: '00',
		sapRouterString: 'Rawr',
		sncEnabled: true,
		ssoEnabled: true,
		sncName: '',
		sncLevel: SecurityLevel.Encrypted,
	};

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
		systems.push({
			id: i,
			name: `W4D (${i})`,
			description: 'Test',
			supportsSSO: true,
			router: 'ABAP',
			messageServer: 'Some Server',
		});
	}
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
		<ConnectionList {systems} {height}></ConnectionList>
	</section>

	<section class="custom-connection">
		<h2 class="table-title">Customize Connection</h2>
		<p>
			Create a new connection from scratch or modify an existing connection from
			the provided selection.
		</p>
		<hr />
		<ConnectionForm connectionData={mockConnectionData}></ConnectionForm>
	</section>
</main>

<style>
	.container {
		display: flex;
		margin: 20px 20px 0;
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

<script lang="ts">
	import ConnectionList, { type System } from './lib/ConnectionList.svelte';
	import Dropdown from './lib/Dropdown.svelte';

	let height = $state(70);

	let systems: System[] = $state([]);

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
			SAP Logon Pad system connections are automatically detected from the
			installation files or a <a
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
		<Dropdown></Dropdown>
	</section>
</main>

<style>
	.container {
		display: flex;
		flex-direction: row;
	}

	hr {
		border: none;
		height: 1px;
		background-color: var(--vscode-menu-separatorBackground);
		margin: 16px 0;
	}

	.predefined-connections {
		flex: 1;
		padding: 20px;
	}

	.custom-connection {
		flex: 1;
		padding: 20px;
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

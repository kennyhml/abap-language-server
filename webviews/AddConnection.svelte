<script lang="ts">
	import ConnectionList, { type System } from './lib/ConnectionList.svelte';
	import InfoIcon from './assets/info.svg';

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
		<h2 class="table-title">Predefined Connections</h2>
		<ConnectionList {systems} {height}></ConnectionList>

		<section class="info-section">
			<img src={InfoIcon} alt="Information icon" />
			<div class="text-block">
				<h2>Predefined Systems can be distributed by your Administrator</h2>
				<p>
					These systems are derived from the systems available in the SAP Logon.
					Please ask your System Administrator to provide you with the necessary
					file and follow the instructions.
				</p>
			</div>
		</section>
	</section>

	<section class="custom-connection">
		<h2 class="table-title">Create Custom Connection</h2>
	</section>
</main>

<!-- Left Side -->

<style>
	.container {
		display: flex;
		flex-direction: row;
	}

	.info-section {
		padding-top: 10px;
		display: flex;
		align-items: center;
		gap: 15px;
	}

	.info-section img {
		height: 110px;
		width: 110px;
	}

	.text-block {
		display: flex;
		flex-direction: column;
	}

	.text-block h2 {
		font-size: 1.5em;
		font-weight: bold;
		margin: 0;
	}

	.text-block p {
		font-size: 1.2em;
		margin: 5px 0 0 0;
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

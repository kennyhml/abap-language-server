<script lang="ts">
	import {
		type ConnectionResult,
		type EditConnectionMessages,
		type ConnectionData,
		MessageChannel,
	} from 'extension';
	import SystemForm from './lib/SystemForm.svelte';

	let systemData: ConnectionData | undefined = $state();
	let vscode = acquireVsCodeApi();

	let messageChannel = new MessageChannel<EditConnectionMessages>({
		dispatch: vscode.postMessage,
		listen: (listener) =>
			window.addEventListener('message', (event) => listener(event.data)),
	});

	messageChannel.onDidReceive('initialize', async (data) => {
		systemData = data.connection;
	});

	function onConnectionSubmitted(
		connection: ConnectionData,
	): Promise<ConnectionResult> {
		return messageChannel.send('doEdit', { connection });
	}

	function onConnectionTestRequested(
		connection: ConnectionData,
	): Promise<ConnectionResult> {
		return messageChannel.send('doTest', { connection });
	}
</script>

<main>
	<section>
		<h2>Editing {systemData?.name}</h2>
		<span
			>Modify and test the connection properties, press save to edit the
			connection. Close the panel to cancel.</span
		>
		<hr />
		{#if systemData}
			<SystemForm
				bind:systemData
				onSubmit={onConnectionSubmitted}
				onTest={onConnectionTestRequested}
			/>
		{:else}
			<p>Waiting for data...</p>
		{/if}
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		margin: 25px 20px;
		height: 75vh;
	}

	main section {
		display: flex;
		flex-direction: column;
		height: 90vh;
		width: 67vh;
	}

	hr {
		border: none;
		height: 1px;
		background-color: var(--vscode-menu-separatorBackground);
		margin: 16px 0;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--vscode-editor-foreground);
		font-family: Arial, sans-serif;
		text-align: left;
	}
</style>

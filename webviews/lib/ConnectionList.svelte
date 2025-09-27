<script lang="ts">
	export type System = {
		name: string;
		description: string;
		supportsSSO: boolean;
		router: string;
		messageServer: string;
	};

	let searchFilter: string = $state('');

	let { items }: { items: System[] } = $props();
</script>

<div class="content">
	<input bind:value={searchFilter} placeholder="Search" />

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Description</th>
					<th>Message Server</th>
					<th>SSO</th>
					<th>Router</th>
				</tr>
			</thead>
			<tbody>
				{#each items as system}
					<tr>
						<td>{system.name}</td>
						<td>{system.description}</td>
						<td>{system.messageServer}</td>
						<td>{system.supportsSSO ? 'Yes' : 'No'}</td>
						<td>{system.router}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.table-container {
		height: 70vh;
		overflow-y: auto;
	}

	.content input {
		box-sizing: border-box;
		width: 60%;
		margin-bottom: 5px;
		background-color: var(--vscode-input-background);
		color: var(--vscode-input-foreground);
		border: 1px solid var(--vscode-dropdown-border);
		outline: none;
	}

	.content input:focus {
		border-color: var(--vscode-inputOption-activeBorder);
		outline: none;
	}

	table {
		width: 100%;
		border-radius: 8px;
		border-collapse: collapse;
		background-color: var(--vscode-editorInlayHint-background);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		font-family: Arial, sans-serif;
		table-layout: fixed;
	}

	th,
	td {
		padding: 4px 4px;
		text-align: left;
		border: 1px solid var(--vscode-sideBar-border);
		color: var(--vscode-editor-foreground);
	}

	tr:nth-child(even) {
		background-color: var(--vscode-list-inactiveSelectionBackground);
	}

	tr:hover {
		background-color: var(--vscode-sideBar-background);
	}

	th {
		font-weight: bold;
		font-size: 1.15em;
		color: var(--vscode-list-focusForeground);
		background-color: var(--vscode-activityBar-background);
	}
</style>

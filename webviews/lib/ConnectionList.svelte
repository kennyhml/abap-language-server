<script lang="ts">
	export type System = {
		id: number;
		name: string;
		description: string;
		supportsSSO: boolean;
		router: string;
		messageServer: string;
	};

	let { systems, height }: { systems: System[]; height: number } = $props();

	let searchFilter: string = $state('');
	let selectedIndex = $state(-1);

	function matchesFilter(itemName: string): boolean {
		if (!searchFilter) {
			return true;
		}
		return itemName.toLowerCase().includes(searchFilter.toLowerCase());
	}

	function onSystemSelected(system: System) {
		selectedIndex = system.id;
	}

	function anyMatchesFilter(): boolean {
		return (
			systems.length > 0 &&
			systems.find((system) =>
				system.name.toLowerCase().includes(searchFilter.toLowerCase()),
			) !== undefined
		);
	}

	$inspect(selectedIndex, console.log);
</script>

<div class="content">
	<input bind:value={searchFilter} placeholder="Search" />

	<div class="table-container" style="height: {height}vh;">
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
				{#each systems as system, i}
					{#if matchesFilter(system.name)}
						<tr
							onclick={() => onSystemSelected(system)}
							class:highlighted={i === selectedIndex}
						>
							<td>{system.name}</td>
							<td>{system.description}</td>
							<td>{system.messageServer}</td>
							<td>{system.supportsSSO ? 'Yes' : 'No'}</td>
							<td>{system.router}</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>

		{#if !anyMatchesFilter()}
			<p class="not-found">
				No System matches this filter - please check again.
			</p>
		{/if}
	</div>
</div>

<style>
	.table-container {
		overflow-y: auto;
	}

	.not-found {
		width: 100%;
		text-align: center;
		font-weight: bold;
	}

	th,
	td {
		padding: 4px 4px;
		text-align: left;
		border-left: 1px solid var(--vscode-sideBar-border);
		border-bottom: 1px solid var(--vscode-sideBar-border);

		color: var(--vscode-editor-foreground);
	}

	td:last-child {
		border-right: 1px solid var(--vscode-sideBar-border);
	}

	td:first-child {
		border-left: 1px solid var(--vscode-sideBar-border);
	}

	.highlighted td {
		border-top: 1px solid var(--vscode-inputOption-activeBorder);
		border-bottom: 1px solid var(--vscode-inputOption-activeBorder);
	}

	.highlighted td:first-child {
		border-left: 1px solid var(--vscode-inputOption-activeBorder);
	}

	.highlighted td:last-child {
		border-right: 1px solid var(--vscode-inputOption-activeBorder);
	}

	.content input {
		width: 60%;
		margin-bottom: 5px;
		background-color: var(--vscode-input-background);
		color: var(--vscode-input-foreground);
		border: 1px solid var(--vscode-dropdown-border);
	}

	.content input:focus {
		border-color: var(--vscode-inputOption-activeBorder);
		outline: none;
	}

	table {
		width: 100%;
		border-radius: 8px;
		background-color: var(--vscode-editorInlayHint-background);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		font-family: Arial, sans-serif;
		table-layout: fixed;
		border-spacing: 0;
		border-collapse: separate;
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

<script lang="ts">
	import TextInput from './TextInput.svelte';

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
	let matchingSystems: System[] = $derived(getMatchingSystems());
	let selectedSystem: number = $state(-1);

	function getMatchingSystems() {
		return systems.filter((system) => matchesFilter(system.name));
	}

	function matchesFilter(itemName: string): boolean {
		if (!searchFilter) {
			return true;
		}
		return itemName.toLowerCase().includes(searchFilter.toLowerCase());
	}

	function onSystemSelected(system: System) {
		selectedSystem = system.id;
	}

	function noneMatchFilter(): boolean {
		return systems.length !== 0 && matchingSystems.length === 0;
	}
</script>

<div class="content">
	<TextInput
		bind:value={searchFilter}
		placeholder="Search"
		style="width: 60%; margin-bottom: 5px; border-radius: 2px"
	/>

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
				{#each matchingSystems as system}
					<tr
						onclick={() => onSystemSelected(system)}
						class:highlighted={system.id === selectedSystem}
					>
						<td>{system.name}</td>
						<td>{system.description}</td>
						<td>{system.messageServer}</td>
						<td>{system.supportsSSO ? 'Yes' : 'No'}</td>
						<td>{system.router}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if noneMatchFilter()}
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

	thead {
		position: sticky;
		top: 0;
		z-index: 1;
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

	table {
		width: 100%;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		font-family: Arial, sans-serif;
		table-layout: fixed;
		border-spacing: 0;
		border-collapse: separate;
	}

	tr:nth-child(odd) {
		background-color: #2d2d2d;
	}
	tr:nth-child(even) {
		background-color: #3c3c3c;
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

<script lang="ts">
	import type { Connection } from 'types/connection';
	import TextInput from './TextInput.svelte';
	import SecureIcon from '../assets/secure.svg';
	import InsecureIcon from '../assets/insecure.svg';
	import SSOEnabledIcon from '../assets/ssoEnabled.svg';
	import SSODisabledIcon from '../assets/ssoDisabled.svg';

	let {
		connections,
		onSelectionChange,
	}: {
		connections: Connection[];
		onSelectionChange: (connection: Connection) => void;
	} = $props();

	type UniqueConnection = Connection & { id: number };

	let mappedConnections = connections
		.sort((a, b) => a.systemId.localeCompare(b.systemId))
		.map((v, i) => ({ ...v, id: i }));

	let searchFilter: string = $state('');
	let matchingEntries = $derived(getMatchingConnections());

	let selectedId: number = $state(-1);

	function getMatchingConnections(): UniqueConnection[] {
		if (!searchFilter) {
			return mappedConnections;
		}
		let filter = searchFilter.toLowerCase();
		return mappedConnections.filter(
			(conn) =>
				conn.systemId.toLowerCase().includes(filter) ||
				conn.name.toLowerCase().includes(filter),
		);
	}

	function onSelected(connection: UniqueConnection) {
		if (selectedId !== connection.id) {
			selectedId = connection.id;
			const { id, ...conn } = connection;
			onSelectionChange(conn);
		}
	}

	function noneMatchFilter(): boolean {
		return mappedConnections.length !== 0 && matchingEntries.length === 0;
	}
</script>

<div class="content">
	<TextInput
		bind:value={searchFilter}
		placeholder="Search"
		style="width: 60%; margin-bottom: 5px; border-radius: 2px"
	/>

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>SID</th>
					<th>Name</th>
					<th>Description</th>
					<th>SNC</th>
					<th>SSO</th>
					<th>Router</th>
				</tr>
			</thead>
			<tbody>
				{#each matchingEntries as conn}
					<tr
						onclick={() => onSelected(conn)}
						class:highlighted={conn.id === selectedId}
					>
						<td>{conn.systemId}</td>
						<td>{conn.name}</td>
						<td>{conn.description}</td>
						{#if conn.sncEnabled}
							<td class="icon"><img src={SecureIcon} alt="Secure" /></td>
						{:else}
							<td class="icon"><img src={InsecureIcon} alt="Insecure" /></td>
						{/if}
						{#if conn.ssoEnabled}
							<td class="icon"><img src={SSOEnabledIcon} alt="Secure" /></td>
						{:else}
							<td class="icon"><img src={SSODisabledIcon} alt="Insecure" /></td>
						{/if}
						<td>{conn.sapRouterString}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if connections.length === 0}
			<p class="not-found">
				No connections found. Follow <a href="https://github.com/kennyhml"
					>the instructions</a
				> to add a connection provider.
			</p>
		{:else if noneMatchFilter()}
			<p class="not-found">
				No connection matches this filter - please check again.
			</p>
		{/if}
	</div>
</div>

<style>
	.table-container {
		overflow-y: auto;
		max-height: 70vh;
	}

	.icon {
		text-align: center;
		vertical-align: bottom;
	}

	.icon img {
		margin-top: 2px;
		margin-bottom: -3px;
		width: 18px;
		height: 18px;
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
		white-space: nowrap;

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
		table-layout: auto;
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

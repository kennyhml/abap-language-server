import { EventEmitter, type Memento, workspace, window } from 'vscode';
import {
	isRfcConnection,
	type ConnectionData,
	type ConnectionResult,
} from 'core';
import { ADT_URI_SCHEME, getConnectionUri } from './uri';
import { AbapLanguageClient } from './languageClient';
import { isLanguageServerRunning } from 'core/client';
import * as vscode from 'vscode';

/**
 * Event to inform listeners when a connection changed, even when the entity
 * that has changed is an {@link Connection active connection} rather than
 * the global store data, the data is passed in the event instead and the
 * listener can try access the (possibly no longer) active connection if needed.
 */
export type ConnectionStateChanged = {
	kind: 'added' | 'deleted' | 'disconnected' | 'connected';
	connection: ConnectionData;
};

/**
 * Manages the system connections.
 *
 * Provides functionality to add connections to the global store, add them
 * to the workspace, connect to or test a {@link Connection}, persisting
 * their state or disconnecting from one.
 *
 */
export class ConnectionManager {
	constructor(private workspaceState: Memento, private globalState: Memento) {
		this.globalConnections = this.loadGlobalConnections();

		this.activeConnections = [];
		this.restoreWorkspaceConnections();
	}

	/**
	 * Parks __all__ currently active connections in the session.
	 *
	 * Should be called when the extension deactivates, regardless of whether that
	 * is due to a reload, restart or long-term termination of the IDE.
	 *
	 * The language clients are disconnected __implicitly__ meaning a Time-to-Live
	 * for the client on the backend applies. The clients which were connected
	 * at the time of the shutdown remain persisted to the workspace storage and
	 * will attempt to automatically restore that session if reactivated in a
	 * short timeframe.
	 *
	 * This is contrary to an __explicit__ shutdown where the user chooses to disconnect
	 * from one or more clients via the tree view or a command, but the extension itself
	 * keeps running.
	 */
	public async park(): Promise<void> {
		await Promise.all(this.activeConnections.map((conn) => conn.disconnect()));
	}

	/**
	 * Adds a connection to the global state for reuse across workspaces.
	 *
	 * These are shown to the user in the __Connection Tree View__, the explorer
	 * connections are instead scoped to the active workspace.
	 *
	 * @fires {@link onDidChangeConnection} with an __`"added"`__ event.
	 *
	 * If the name of the connection is already in use, an error is thrown.
	 *
	 * @param connection The data of the connection to add.
	 */
	public addGlobalConnection(connection: ConnectionData): void {
		if (this.globalConnections.find((conn) => conn.name === connection.name)) {
			throw Error('Duplicate connection names are not allowed.');
		}

		this.globalConnections.push(connection);
		this.dumpGlobalConnections();
		console.log(`Connection '${connection.name}' has been added.`);
		this._onDidChangeConnection.fire({ connection, kind: 'added' });
	}

	/**
	 * Updates a connection in the global pool of available connections.
	 *
	 * Under the hood, this just deletes and adds a new connection.
	 *
	 * @fires {@link onDidChangeConnection} with a __`"deleted"`__ , then an __"`added`"__ event.
	 *
	 * @param oldData The previous data of the connection to replace.
	 * @param newData The new data to replace the old connection data with.
	 */
	public updateGlobalConnection(
		oldData: ConnectionData,
		newData: ConnectionData,
	): void {
		this.removeGlobalConnection(oldData);
		this.addGlobalConnection(newData);
	}

	/**
	 * Deletes a connection from the global pool of available connections.
	 *
	 * @fires {@link onDidChangeConnection} with a __`"deleted"`__ event.
	 *
	 * @param connection The data of the connection to be removed.
	 */
	public removeGlobalConnection(connection: ConnectionData): void {
		let index = this.globalConnections.findIndex(
			(conn) => conn.name === connection.name,
		);
		if (index === -1) {
			throw Error(`Could not find a connection named ${connection.name}`);
		}
		this.globalConnections.splice(index, 1);
		this.dumpGlobalConnections();

		console.log(`Connection '${connection.name}' has been deleted.`);
		this._onDidChangeConnection.fire({ connection, kind: 'deleted' });
	}

	public getWorkspaceConnections(): ConnectionData[] {
		// There could be folders in the workspace that have nothing to do
		// with our connections, so we have to make sure to check some criteria.
		let folders = (workspace.workspaceFolders ?? []).filter(
			(f) => f.uri.scheme === ADT_URI_SCHEME,
		);
		return this.globalConnections.filter((conn) => {
			return !!folders.find(
				(f) => f.uri.authority.toUpperCase() === conn.systemId.toUpperCase(),
			);
		});
	}

	public getActiveWorkspaceConnections(): Connection[] {
		return this.activeConnections;
	}

	/**
	 * Disconnects from a {@link Connection} matching the data given, if valid.
	 *
	 * This initiates an __explicit__ disconnect on a per-connection basis. That means that
	 * no Time-To-Live for the connections context applies, it is immediately destroyed on
	 * the backend and cannot be restored when the connection is re-established.
	 *
	 * Thus, this is suitable to handle explicit, user intended disconnects from particular
	 * systems or disconnecting from all via a command but without shutting down the editor.
	 *
	 * @param data The data of the connection to close. The `systemId` must match.
	 *
	 * @throws if there is no active connection for the given data.
	 */
	public async disconnect(data: ConnectionData) {
		let idx = this.activeConnections.findIndex(
			(c) => c.data.systemId === data.systemId,
		);
		if (idx === -1) {
			throw Error(`Not connected to any system '${data.name}'`);
		}
		let connection = this.activeConnections.splice(idx, 1)[0];
		await connection.disconnect();
		this._onDidChangeConnection.fire({
			connection: connection.data,
			kind: 'disconnected',
		});
	}

	/**
	 * Attempts to connect to a system with the given connection parameters.
	 *
	 * Do not use this method to attempt to restore a parked session. Re-establishing
	 * parked connects happens automatically during extension startup and should not
	 * be attempted any time afterwards.
	 *
	 * @param params The data of the connection to establish.
	 *
	 * @returns A {@link Connection connection} to the target system.
	 */
	public async connect(params: ConnectionData): Promise<Connection> {
		if (this.getActive(params.systemId)) {
			throw Error(`Already connected to ${params.name}`);
		}

		const workspaceUri = getConnectionUri(params);
		const folders = workspace.workspaceFolders ?? [];
		// The connection may or may not have been added to the workspace yet. The obnoxious
		// part is that, in certain scenarios, such as changing the first folder in the workspace
		// or transitioning into a multi-root workspace, will forcefully reload the workspace
		// and thus also all extensions.
		// We can mitigate the issue by always appending new folders to the end of the list, but
		// fundamentally this is one of the reasons why the connection parking is so important.
		if (!folders.some((f) => f.name === params.systemId)) {
			window.showWarningMessage(
				`Adding '${params.systemId}' to workspace, editor might reload...`,
			);
			workspace.updateWorkspaceFolders(folders.length, 0, {
				uri: workspaceUri,
				name: params.systemId,
			});
			console.log(`Added a workspace folder for '${params.name}'.`);
		}

		const connection = await Connection.connect(params);
		this.activeConnections.push(connection);
		await this.dumpWorkspaceConnections();
		console.log(`Established workspace connection to '${params.name}'.`);
		this._onDidChangeConnection.fire({ connection: params, kind: 'connected' });
		return connection;
	}

	/**
	 * Tests connecting to a system with the given connection parameters.
	 *
	 * If the connection succeeded, the client is immediately shutdown again.
	 * No workspace folder is created.
	 *
	 * @param params The data of the connection to establish.
	 *
	 * @returns The result of the attempt to connect.
	 */
	public async testConnect(params: ConnectionData): Promise<ConnectionResult> {
		if (this.getActive(params.systemId)) {
			return {
				success: false,
				message: 'Already connected to this system.',
			};
		}

		try {
			const connection = await Connection.connect(params);
			await connection.disconnect();
			return {
				success: true,
				message: 'The connection is valid.',
			};
		} catch (err: any) {
			return {
				success: false,
				message: err.message ?? 'Unknown error',
			};
		}
	}

	/**
	 * Gets a {@link ConnectionData data} for the requested system id if available.
	 *
	 * @param params The __SID__ (System ID) of the system to get the connection data for.
	 *
	 * @returns Either the {@link ConnectionData} to the system or `undefined`.
	 */
	public getData(systemId: string): ConnectionData | undefined {
		return this.globalConnections.find((conn) => conn.systemId === systemId);
	}

	/**
	 * Gets a {@link ConnectionData data} for the requested system id if available.
	 *
	 * @param params The __SID__ (System ID) of the system to get the connection data for.
	 *
	 * @returns Either the {@link ConnectionData} to the system or `undefined`.
	 */
	public getAllData(): ConnectionData[] {
		return this.globalConnections;
	}

	/**
	 * Gets a {@link Connection connection} for the requested connection data if available.
	 *
	 * @param params The __SID__ (System ID) of the system to get the connection for.
	 *
	 * @returns Either a {@link Connection} to the system or `undefined`.
	 */
	public getActive(systemId: string): Connection | undefined {
		return this.activeConnections.find(
			(conn) => conn.data.systemId === systemId,
		);
	}

	/**
	 * Loads the saved global connections from the global state.
	 *
	 * @returns A (possibly empty) list of saved {@link ConnectionData}.
	 */
	private loadGlobalConnections(): ConnectionData[] {
		return this.globalState.get('connections') ?? [];
	}

	private loadWorkspaceConnections(): string[] {
		return this.workspaceState.get('parkedConnections') ?? [];
	}

	/**
	 * Dumps the global connections to the global state storage for persistence.
	 */
	private async dumpGlobalConnections(): Promise<void> {
		await this.globalState.update('connections', this.globalConnections);
	}

	/**
	 * Dumps the active connections to the workspace state storage for connection parking.
	 */
	private async dumpWorkspaceConnections(): Promise<void> {
		let parked = this.activeConnections.map((conn) => conn.data.systemId);
		await this.workspaceState.update('parkedConnections', parked);
	}

	/**
	 * Restores a connection that was temporarily parked due to an implicit shutdown.
	 *
	 * In an ideal world, this means that the client context on the backend has not reached
	 * the end of its Time-to-Live since the shutdown and the context can be restored.
	 *
	 * If this assumption does not hold true and the backend informs us that there is no
	 * parked context left for this session, `undefined` is returned.
	 */
	private async restore(
		params: ConnectionData,
	): Promise<Connection | undefined> {
		const connection = await Connection.restore(params);
		if (!connection) {
			return undefined;
		}

		this.activeConnections.push(connection);
		console.log(`Restored workspace connection to '${params.name}'.`);
		this._onDidChangeConnection.fire({ connection: params, kind: 'connected' });
		return connection;
	}

	/**
	 * Implementation detail to restore parked workspace connections on startup.
	 *
	 * @note If one or more parked workspace connections exist, but the language
	 * server process is not currently running, no attempts to restore connections
	 * will be made as there cant be any client contexts left to restore anyway.
	 */
	private async restoreWorkspaceConnections() {
		let parked = this.loadWorkspaceConnections();
		if (!parked || parked.length === 0) {
			console.log('No parked connections to restore.');
		} else if (!isLanguageServerRunning()) {
			vscode.window.showErrorMessage(
				'Parked connections could not be restored, the language server has unexpectedly shut down.',
			);
		} else {
			await this.restoreConnectionsImpl(parked);
		}
		await this.dumpWorkspaceConnections();
	}

	/**
	 * Attempts to restore the provided workspace connections by system id.
	 *
	 * Wrapped in a vscode progress bar to indicate to the user that something is
	 * going on.
	 *
	 * If re-establishing a connection fails, a warning is displayed.
	 */
	private async restoreConnectionsImpl(connections: string[]) {
		const toRestore = connections.length;
		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `Restoring ${toRestore} parked connections..`,
				cancellable: false,
			},
			async (progress, _token) => {
				const promises = connections.map((system, idx) => async () => {
					const data = this.getData(system)!;
					if (!(await this.restore(data))) {
						vscode.window.showWarningMessage(
							`Could not restore parked connection '${system}'.`,
						);
					}
					progress.report({
						message: `${system} (${idx + 1}/${toRestore})`,
						increment: 100 / toRestore,
					});
				});

				await Promise.all(promises.map((p) => p()));
			},
		);
	}

	private readonly _onDidChangeConnection =
		new EventEmitter<ConnectionStateChanged>();
	public readonly onDidChangeConnection = this._onDidChangeConnection.event;

	private globalConnections: ConnectionData[];
	private activeConnections: Connection[];
}

/**
 * Represents an active connection to a SAP system in the workspace.
 *
 * This drives communication with the language client to provide the essential
 * functionality of a system connection such as filetrees, editors and context.
 */
export class Connection {
	private constructor(
		public readonly data: ConnectionData,
		private languageClient: AbapLanguageClient,
	) {}

	public static async connect(data: ConnectionData): Promise<Connection> {
		if (isRfcConnection(data.params)) {
			throw Error('Rfc connections are not supported');
		}
		let client = await AbapLanguageClient.connect(data);

		return new Connection(data, client);
	}

	public static async restore(
		data: ConnectionData,
	): Promise<Connection | undefined> {
		if (isRfcConnection(data.params)) {
			throw Error('Rfc connections are not supported');
		}
		try {
			let client = await AbapLanguageClient.connect(data, true);
			return new Connection(data, client);
		} catch (err) {
			return undefined;
		}
	}

	public getLanguageClient(): AbapLanguageClient {
		return this.languageClient;
	}

	public async disconnect() {
		this.languageClient.kill();
	}
}

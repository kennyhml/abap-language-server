import { EventEmitter, type Memento, workspace, window } from 'vscode';
import {
	isRfcConnection,
	type ConnectionData,
	type ConnectionResult,
} from 'core';
import { ADT_URI_SCHEME, getConnectionUri } from './uri';
import { AbapLanguageClient } from './languageClient';

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

		// Todo: Check the workspace state if there are any connections to restore
		this.activeConnections = [];
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
	 * Connects to a system with the given connection parameters.
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
		// The connection may or may not have been added to the workspace yet. The annoying
		// part is that in certain scenarios, such as changing the first folder in the workspace
		// or transitioning into a multi-root workspace, will forcefully reload the workspace
		// and thus also all extensions. Thats why we have to make sure to always append the
		// new folder to the end and be able to handle the extension reloading at any time.
		if (!folders.some((f) => f.name === params.systemId)) {
			window.showWarningMessage(
				`Adding ${params.systemId} to workspace, extension might reload...`,
			);
			workspace.updateWorkspaceFolders(folders.length, 0, {
				uri: workspaceUri,
				name: params.systemId,
			});
			console.log(`Added a workspace folder for '${params.name}'.`);
		}

		const connection = await Connection.connect(params);
		this.activeConnections.push(connection);
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

	/**
	 * Dumps the global connections to the global state storage for persistence.
	 */
	private dumpGlobalConnections(): void {
		this.globalState.update('connections', this.globalConnections);
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

	public static async connect(data: ConnectionData) {
		if (isRfcConnection(data.params)) {
			throw Error('Rfc connections are not supported');
		}
		let client = await AbapLanguageClient.connect(data);

		return new Connection(data, client);
	}

	public getLanguageClient(): AbapLanguageClient {
		return this.languageClient;
	}

	public async disconnect() {
		this.languageClient.kill();
	}
}

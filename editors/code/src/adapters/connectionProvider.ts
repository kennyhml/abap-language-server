import {
	ConnectionState,
	type ConnectionResult,
	type SystemConnection,
} from 'core';
import { EventEmitter, type Event, type Memento } from 'vscode';
import { SystemConnectionClient } from './connectionClient';

/**
 * Central component to manage and provide the system connections.
 *
 * Connections should be created, edited, connected and disconnected to
 * through an instance of this provider to ensure that the respective
 * components receive note of such updates through the event emitter.
 */
export class SystemConnectionProvider {
	private readonly _onDidChangeSystems = new EventEmitter<void>();
	public readonly onDidChangeSystems: Event<void> =
		this._onDidChangeSystems.event;

	public readonly connections: SystemConnection[];

	constructor(private workspaceState: Memento) {
		this.connections = this.loadSystemConnections();
		this.connections.forEach(
			(system) => (system.state = ConnectionState.disconnected),
		);
	}

	/**
	 * Gets the data of the requested system connection, if existent.
	 *
	 * @param name The name of the {@link SystemConnection} to get the data of.
	 *
	 * @returns The corresponding {@link SystemConnection} or `undefined`.
	 */
	public getConnection(name: string): SystemConnection | undefined {
		return this.connections.find((system) => system.name === name);
	}

	/**
	 * Retrieves the connection client for a system connection if existent.
	 *
	 * @param connectionName The name of the {@link SystemConnection} to retrieve a client for.
	 *
	 * @returns A {@link any} to perform operations on the connection or `undefined`
	 */
	public getConnectionClient(
		_connectionName: string,
	): SystemConnectionClient | undefined {
		return;
	}

	public async createConnectionClient(
		connection: SystemConnection,
	): Promise<SystemConnectionClient> {
		return SystemConnectionClient.connect(connection);
	}

	/**
	 * Verifies the validity of the given system connection and, if valid, adds it to
	 * the connection pool of the workspace and fires the `onDidChangeSystems` event.
	 *
	 * @param connection The {@link SystemConnection} to persist to the workspace pool.
	 *
	 * @returns A {@link ConnectionResult} whether the connection was added with an
	 * error message if the verification failed.
	 */
	public async addConnection(
		connection: SystemConnection,
	): Promise<ConnectionResult> {
		console.log(`Verifying and adding connection '${connection.name}'..`);
		let verificationResult = await this.testConnection(connection);
		if (!verificationResult.success) {
			return verificationResult;
		}
		this.connections.push({
			...connection,
			state: ConnectionState.disconnected,
		});
		this.dumpSystemConnections();
		return { success: true, message: 'Connection added to workspace.' };
	}

	public deleteConnection(name: string): void {
		const index = this.connections.findIndex((conn) => conn.name === name);
		if (index === -1) {
			throw Error(`No System Connection named ${name} was found.`);
		}
		if (this.connections[index].state === ConnectionState.connected) {
			throw Error(`Disconnect from the system before deleting it.`);
		}
		this.connections.splice(index, 1);
		this.dumpSystemConnections();
	}

	public async testConnection(
		connection: SystemConnection,
	): Promise<ConnectionResult> {
		try {
			let client = await this.createConnectionClient(connection);
			await client.stop();
			return {
				success: true,
				message: 'Connection is valid.',
			};
		} catch (err: any) {
			return {
				success: false,
				message: err.message ?? 'Unknown error',
			};
		}
	}

	public updateConnection(name: string, newData: SystemConnection): void {
		let index = this.connections.findIndex((s) => s.name === name);
		if (index === -1) {
			throw Error('System Connection not found');
		}
		if (this.connections[index].state === ConnectionState.connected) {
			throw Error('Cannot update active system connection.');
		}
		this.connections[index] = newData;
		this.dumpSystemConnections();
	}

	private loadSystemConnections(): SystemConnection[] {
		return this.workspaceState.get('systems') ?? [];
	}

	private dumpSystemConnections(): void {
		this.workspaceState.update('systems', this.connections);
		this._onDidChangeSystems.fire();
	}
}

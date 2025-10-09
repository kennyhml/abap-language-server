import {
	ConnectionState,
	type ConnectionTestResult,
	type SystemConnection,
} from 'core';
import { EventEmitter, type Event, type Memento } from 'vscode';
import { SystemConnectionClient } from './client';

/**
 * Central component to manage and provide the system connections.
 *
 * Connections should be created, edited, connected and disconnected to
 * through an instance of this provider to ensure that the respective
 * components receive note of such updates through the event emitter.
 */
export class SystemConnectionProvider {
	private readonly onSystemsChanged = new EventEmitter<void>();

	public readonly onDidChangeSystems: Event<void> = this.onSystemsChanged.event;
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

	public async testConnection(
		connection: SystemConnection,
	): Promise<ConnectionTestResult> {
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
		this.onSystemsChanged.fire();
	}

	private loadSystemConnections(): SystemConnection[] {
		return this.workspaceState.get('systems') ?? [];
	}

	private dumpSystemConnections(): void {
		this.workspaceState.update('systems', this.connections);
	}
}

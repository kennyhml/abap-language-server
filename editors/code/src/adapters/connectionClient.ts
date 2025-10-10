import { LanguageClient } from 'vscode-languageclient/node';
import {
	ConnectionState,
	isRfcConnection,
	type SystemConnection,
} from '../core';
import { EventEmitter } from 'vscode';
import { getLanguageClient } from './languageClient';

/**
 * Provides functionality to interact with a connected sap system.
 */
export class SystemConnectionClient {
	private _onDidStateChange = new EventEmitter<ConnectionState>();
	public readonly onDidStateChange = this._onDidStateChange.event;

	private constructor(
		private languageClient: LanguageClient,
		private connection: SystemConnection,
	) {}

	public getLanguageClient(): LanguageClient {
		return this.languageClient;
	}

	public getConnection(): SystemConnection {
		return this.connection;
	}

	public static async connect(
		connection: SystemConnection,
	): Promise<SystemConnectionClient> {
		if (isRfcConnection(connection.params)) {
			throw Error('Rfc connections are not supported');
		}
		let client = await getLanguageClient();
		try {
			if (client.needsStart()) {
				await client.start();
			}
			let response = await client.sendRequest('connection/connect', {
				...connection.params,
				systemId: connection.systemId,
				authentication: {
					kind: 'password',
					username: 'DEVELOPER',
					password: 'ABAPtr2022#01',
				},
			});
			console.log(response);
		} catch (err) {
			client
				.stop()
				.then(() => {
					console.log('Server has been stopped.');
				})
				.catch((err) => {
					console.error('Could not stop the server: ', err);
				});
			throw err;
		}
		return new SystemConnectionClient(client, connection);
	}
}

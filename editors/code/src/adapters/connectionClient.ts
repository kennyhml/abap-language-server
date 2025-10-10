import { LanguageClient, type StreamInfo } from 'vscode-languageclient/node';
import {
	ConnectionState,
	isRfcConnection,
	type ConnectionResult,
	type SystemConnection,
} from '../core';
import { type LanguageClientOptions } from 'vscode-languageclient/node';
import * as vscode from 'vscode';
import { EventEmitter } from 'vscode';
import { establishServerConnection } from 'core/client';

// const silentShutdown: ErrorHandler = {
// 	error(error: Error, message: any, count: number): ErrorHandlerResult {
// 		console.error('Language server error:', error, message, `Attempt ${count}`);
// 		return { handled: true, action: ErrorAction.Continue };
// 	},

// 	closed(): CloseHandlerResult {
// 		console.warn('Language server connection closed.');
// 		return { handled: true, action: CloseAction.DoNotRestart };
// 	},
// };

async function createClient(
	connection: SystemConnection,
): Promise<LanguageClient> {
	let clientOptions: LanguageClientOptions;

	let ch = vscode.window.createOutputChannel('ABAP Language Server', 'abap');
	clientOptions = {
		outputChannel: ch,
	};

	let serverOptions = async (): Promise<StreamInfo> => {
		let socket = await establishServerConnection();
		return { writer: socket, reader: socket, detached: true };
	};

	return new LanguageClient(
		'abap',
		`ABAP LSP (${connection.name})`,
		serverOptions,
		clientOptions,
	);
}

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

	/**
	 * Checks whether the given connection is valid to connect to the backend with.
	 *
	 * As this is for testing purposes, language client error popups are suppressed
	 * and no workspace folder is actually created, the client is cleaned up immediatly
	 * and only the result of the operation is returned to the caller.
	 *
	 * @param connection The data of the connection to test.
	 */
	public static async testConnect(
		connection: SystemConnection,
	): Promise<ConnectionResult> {
		if (isRfcConnection(connection.params)) {
			throw Error('Rfc connections are not supported');
		}

		let client = await createClient(connection);
		try {
			await client.start();
			await client.sendRequest('connection/initialize', {
				...connection.params,
			});
			return {
				success: true,
				message: 'Connection is valid, initialization successful.',
			};
		} catch (err: any) {
			return {
				success: false,
				message: err.message ?? 'Unknown error',
			};
		} finally {
			client
				.stop()
				.then(() => {
					console.log('Server has been stopped.');
				})
				.catch((err) => {
					console.error('Could not stop the server: ', err);
				});
		}
	}

	public static async connect(
		connection: SystemConnection,
	): Promise<SystemConnectionClient> {
		if (isRfcConnection(connection.params)) {
			throw Error('Rfc connections are not supported');
		}
		let client = await createClient(connection);
		try {
			await client.start();
			await client.sendRequest('connection/initialize', {
				...connection.params,
			});
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

import { LanguageClient } from 'vscode-languageclient/node';
import {
	isHttpConnection,
	isRfcConnection,
	type SystemConnection,
} from '../core';
import {
	CloseAction,
	ErrorAction,
	type CloseHandlerResult,
	type ErrorHandler,
	type ErrorHandlerResult,
	type LanguageClientOptions,
	type ServerOptions,
	TransportKind,
} from 'vscode-languageclient/node';
import * as vscode from 'vscode';

const silentShutdown: ErrorHandler = {
	error(error: Error, message: any, count: number): ErrorHandlerResult {
		console.error('Language server error:', error, message, `Attempt ${count}`);
		return { handled: true, action: ErrorAction.Continue };
	},

	closed(): CloseHandlerResult {
		console.warn('Language server connection closed.');
		return { handled: true, action: CloseAction.DoNotRestart };
	},
};

async function createClient(
	connection: SystemConnection,
	options?: {
		silent?: boolean;
	},
): Promise<LanguageClient> {
	let clientOptions: LanguageClientOptions;

	let ch = vscode.window.createOutputChannel('ABAP Language Server', 'abap');

	if (isHttpConnection(connection.params)) {
		clientOptions = {
			initializationOptions: {
				systemId: connection.systemId,
				...connection.params,
			},
			outputChannel: ch,
		};
	} else {
		throw Error('not supported');
	}

	if (options?.silent) {
		clientOptions.errorHandler = silentShutdown;
	}

	const serverOptions: ServerOptions = {
		command:
			process.env['__ABAP_LSP_SERVER_DEBUG'] ??
			'C:/dev/abap-lsp/target/debug/abap-lsp.exe',
		transport: TransportKind.stdio,
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
export class SystemConnectionClient extends LanguageClient {
	public static async connect(
		connection: SystemConnection,
	): Promise<SystemConnectionClient> {
		if (isRfcConnection(connection.params)) {
			throw Error('Rfc connections are not supported');
		}
		let client = await createClient(connection, { silent: true });

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
		return client;
	}
}

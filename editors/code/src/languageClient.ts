import type { System } from 'connections';
import { isHttpConnection } from './connections';
import {
	CloseAction,
	ErrorAction,
	LanguageClient,
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
		return { handled: true, action: ErrorAction.Shutdown };
	},

	closed(): CloseHandlerResult {
		console.warn('Language server connection closed.');
		return { handled: true, action: CloseAction.DoNotRestart };
	},
};

export async function createClient(
	system: System,
	options?: {
		silent?: boolean;
	},
): Promise<LanguageClient> {
	let clientOptions: LanguageClientOptions;

	let ch = vscode.window.createOutputChannel('ABAP Language Server', 'abap');

	if (isHttpConnection(system.connection)) {
		clientOptions = {
			initializationOptions: {
				systemId: system.systemId,
				...system.connection.params,
			},
			outputChannel: ch,
		};
	} else {
		throw Error('not supported');
	}

	if (options?.silent) {
		clientOptions.errorHandler = silentShutdown;
		clientOptions.initializationFailedHandler = (err: Error) => {
			console.error(err);
			return false;
		};
	}

	const serverOptions: ServerOptions = {
		command:
			process.env['__ABAP_LSP_SERVER_DEBUG'] ??
			'C:/dev/abap-lsp/target/debug/abap-lsp.exe',
		transport: TransportKind.stdio,
	};

	return new LanguageClient(
		'abap',
		`ABAP LSP (${system.displayName})`,
		serverOptions,
		clientOptions,
	);
}

import type { System } from 'connections';
import { isHttpConnection } from './connections';
import {
	CloseAction,
	ErrorAction,
	LanguageClient,
	RevealOutputChannelOn,
	type CloseHandlerResult,
	type ErrorHandler,
	type ErrorHandlerResult,
	type LanguageClientOptions,
	type ServerOptions,
	TransportKind,
} from 'vscode-languageclient/node';

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

const prodServerOptions: ServerOptions = {
	command:
		process.env['__ABAP_LSP_SERVER_DEBUG'] ??
		'C:/dev/abap-lsp/target/debug/abap-lsp.exe',
	transport: TransportKind.stdio,
};

export async function spawnLanguageClient(
	system: System,
	options?: {
		silent?: boolean;
	},
): Promise<LanguageClient> {
	let clientOptions: LanguageClientOptions;
	let serverOptions: ServerOptions;

	if (isHttpConnection(system.connection)) {
		clientOptions = {
			initializationOptions: {
				port: 50000,
				hostname: 'http://127.0.0.1',
			},
		};
	} else {
		throw Error('not supported');
	}

	if (options?.silent) {
		clientOptions.errorHandler = silentShutdown;
		clientOptions.revealOutputChannelOn = RevealOutputChannelOn.Never;
		clientOptions.initializationFailedHandler = () => {
			return false;
		};
	}

	serverOptions = prodServerOptions;

	return new LanguageClient(
		'abap',
		`ABAP LSP (${system.displayName})`,
		serverOptions,
		clientOptions,
	);
}

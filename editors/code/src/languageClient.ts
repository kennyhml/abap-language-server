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
	type StreamInfo,
	type ServerOptions,
	TransportKind,
} from 'vscode-languageclient/node';
import { connect } from 'net';

const silentErrorHandler: ErrorHandler = {
	error(error: Error, message: any, count: number): ErrorHandlerResult {
		console.error('Language server error:', error, message, `Attempt ${count}`);
		return { handled: true, action: ErrorAction.Continue };
	},

	closed(): CloseHandlerResult {
		console.warn('Language server connection closed.');
		return { handled: true, action: CloseAction.DoNotRestart };
	},
};

const debugServerOptions = (): Promise<StreamInfo> => {
	const connectionInfo = {
		port: 5007,
		host: '127.0.0.1',
	};
	let socket = connect(connectionInfo);
	let result: StreamInfo = {
		writer: socket,
		reader: socket,
		detached: true,
	};
	return Promise.resolve(result);
};

const prodServerOptions: ServerOptions = {
	command: 'C:/dev/abap-lsp/target/debug/abap-lsp.exe',
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
		clientOptions.errorHandler = silentErrorHandler;
		clientOptions.revealOutputChannelOn = RevealOutputChannelOn.Never;
		clientOptions.initializationFailedHandler = () => {
			return false;
		};
	}

	if (process.env.NODE_ENV === 'development') {
		serverOptions = debugServerOptions;
	} else {
		serverOptions = prodServerOptions;
	}

	return new LanguageClient(
		'abap',
		`ABAP LSP (${system.displayName})`,
		serverOptions,
		clientOptions,
	);
}

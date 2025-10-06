import * as vscode from 'vscode';
import { AddConnectionPanel } from './views/addConnection';
import { ConnectionTreeProvider } from './views/connectionProvider';
import {
	CloseAction,
	ErrorAction,
	LanguageClient,
	State,
	TransportKind,
	type CloseHandlerResult,
	type ErrorHandler,
	type ErrorHandlerResult,
	type Executable,
	type ServerOptions,
	type StreamInfo,
} from 'vscode-languageclient/node';
import { connect } from 'net';

export async function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('abap.openAddConnectionScreen', () => {
			AddConnectionPanel.render(context);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('abap.connectToSystem', (...args) => {
			vscode.window.showInformationMessage('Connecting..');
		}),
	);

	vscode.window.registerTreeDataProvider(
		'systems',
		new ConnectionTreeProvider(context),
	);
	const silentErrorHandler: ErrorHandler = {
		error(error: Error, message: any, count: number): ErrorHandlerResult {
			console.error(
				'Language server error:',
				error,
				message,
				`Attempt ${count}`,
			);
			return { handled: true, action: ErrorAction.Shutdown };
		},

		closed(): CloseHandlerResult {
			console.warn('Language server connection closed.');
			return { handled: true, action: CloseAction.DoNotRestart };
		},
	};
	let clientOptions = {
		documentSelector: [{ scheme: 'file', language: 'abap' }],
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher('**/*.abap'),
		},
		initializationOptions: {
			port: 50000,
			hostname: 'http://127.0.0.1',
		},
		initializationFailedHandler: () => {
			return false;
		},
		errorHandler: silentErrorHandler,
	};

	// const debugServerOptions = (): Promise<StreamInfo> => {
	// 	const connectionInfo = {
	// 		port: 5007,
	// 		host: '127.0.0.1',
	// 	};
	// 	let socket = connect(connectionInfo);
	// 	let result: StreamInfo = {
	// 		writer: socket,
	// 		reader: socket,
	// 	};
	// 	return Promise.resolve(result);
	// };

	const run: Executable = {
		command: 'C:/dev/abap-lsp/target/debug/abap-lsp.exe',
		options: {
			env: {
				...process.env,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				RUST_LOG: 'debug',
			},
		},
	};

	const prodServerOptions: ServerOptions = {
		run,
		debug: run,
	};

	let client = new LanguageClient(
		'abap',
		`ABAP LSP`,
		prodServerOptions,
		clientOptions,
	);

	try {
		await client.start();
	} catch (err: any) {
		console.error(err);
		// await client.stop();
	}
	console.log('Extension activated.');
}

export function deactivate() {}

import * as vscode from 'vscode';
import { AddConnectionPanel } from './views/addConnection';
import { ConnectionTreeProvider } from './views/connectionProvider';
import {
	LanguageClient,
	type LanguageClientOptions,
	type ServerOptions,
	type StreamInfo,
	TransportKind,
} from 'vscode-languageclient/node';
import { connect } from 'net';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
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
	return;

	let connectionInfo = {
		port: 5007,
		host: '127.0.0.1',
	};

	let serverOptions = () => {
		// Connect to language server via socket
		let socket = connect(connectionInfo);
		let result: StreamInfo = {
			writer: socket,
			reader: socket,
		};
		return Promise.resolve(result);
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.abap'),
		},
	};

	client = new LanguageClient(
		'abap',
		'Language Server Test',
		serverOptions,
		clientOptions,
	);

	client.start();
	console.log('Extension activated.');
}

export function deactivate() {}

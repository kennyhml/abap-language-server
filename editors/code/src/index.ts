import * as vscode from 'vscode';
import { AddConnectionPanel } from './panels/addConnection';
import { ConnectionTreeProvider } from 'views/connectionTree';
import { EditConnectionPanel } from 'panels/editConnection';
import { VirtualFilesystem } from 'adapters/filesystem';
import { ConnectionManager } from 'lib';
import type { ConnectionData } from 'core';
import { SystemDecorationProvider } from 'adapters';

let connections: ConnectionManager;

export async function activate(context: vscode.ExtensionContext) {
	connections = new ConnectionManager(
		context.workspaceState,
		context.globalState,
	);

	const vfs = new VirtualFilesystem(connections);
	const deco = new SystemDecorationProvider(connections, vfs);
	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider('adt', vfs, {
			isCaseSensitive: true,
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('abap.openAddConnectionScreen', () => {
			AddConnectionPanel.render(context, connections);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'abap.disconnectFromSystem',
			(conn: ConnectionData) => {
				connections.disconnect(conn);
			},
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'abap.editSystemConnection',
			(conn: ConnectionData) => {
				EditConnectionPanel.render(context, conn, connections);
			},
		),
	);

	vscode.window.registerFileDecorationProvider(deco);

	context.subscriptions.push(
		vscode.commands.registerCommand('abap.connectToSystem', async (data) =>
			connections.connect(data),
		),
	);

	vscode.window.registerTreeDataProvider(
		'systems',
		new ConnectionTreeProvider(context, connections),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'abap.deleteSystemConnection',
			connections.removeGlobalConnection,
		),
	);

	console.log('Extension activated.');
}

export async function deactivate() {
	console.log('Deactivate.');
	await connections.implicit_close_all();

	// This gives the language clients enough time to send an EXIT notification
	// and peace out cleanly. Could potentially improve this by waiting for the server
	// to return an exit notification when disconnecting the client? Me no like fix delay
	await new Promise((resolve) => setTimeout(resolve, 500));
}

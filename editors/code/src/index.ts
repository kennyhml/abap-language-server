import * as vscode from 'vscode';
import { AddConnectionPanel } from './panels/addConnection';
import { ConnectionTreeProvider } from 'views/connectionTree';
import { EditConnectionPanel } from 'panels/editConnection';
import { VirtualFilesystem } from 'adapters/filesystem';
import { ADT_URI_SCHEME, ConnectionManager } from 'lib';
import type { ConnectionData } from 'core';
import { SystemDecorationProvider } from 'adapters';
import { legend, SemanticHighlighter } from 'adapters/highlighter';

export async function activate(context: vscode.ExtensionContext) {
	let connections = new ConnectionManager(
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

	vscode.languages.registerDocumentSemanticTokensProvider(
		{
			scheme: ADT_URI_SCHEME,
			language: 'abap',
		},
		new SemanticHighlighter(connections),
		legend,
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

export function deactivate() {
	console.log('Deactivate.');
}

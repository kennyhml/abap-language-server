import * as vscode from 'vscode';
import { AddConnectionPanel } from './panels/addConnection';
import { SystemConnectionProvider } from 'adapters/connectionProvider';
import { ConnectionTreeProvider } from 'views/connectionTree';
import type { SystemConnection } from 'core';
import { EditConnectionPanel } from 'panels/editConnection';
import { VirtualFilesystem } from 'adapters/fileSystemProvider';

export async function activate(context: vscode.ExtensionContext) {
	let systemProvider = new SystemConnectionProvider(context.workspaceState);

	const vfs = new VirtualFilesystem(systemProvider);
	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider('adt', vfs, {
			isCaseSensitive: true,
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('abap.openAddConnectionScreen', () => {
			AddConnectionPanel.render(context, systemProvider);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'abap.editSystemConnection',
			(conn: SystemConnection) => {
				EditConnectionPanel.render(context, conn, systemProvider);
			},
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'abap.connectToSystem',
			async (conn: SystemConnection) => {
				const workspaceUri = vscode.Uri.parse(`adt://${conn.systemId}`);
				const workspaceFolders = vscode.workspace.workspaceFolders || [];
				if (
					!workspaceFolders.some(
						(folder) =>
							folder.uri.scheme === 'adt' &&
							folder.uri.authority === conn.systemId,
					)
				) {
					vscode.workspace.updateWorkspaceFolders(0, 0, {
						uri: workspaceUri,
						name: conn.systemId,
					});
				}
				await systemProvider.createConnectionClient(conn);
				vscode.window.showInformationMessage(
					`Connecting to ${conn.systemId}...`,
				);
			},
		),
	);

	vscode.window.registerTreeDataProvider(
		'systems',
		new ConnectionTreeProvider(context, systemProvider),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'abap.deleteSystemConnection',
			(system: SystemConnection) => {
				systemProvider.deleteConnection(system.name);
			},
		),
	);

	console.log('Extension activated.');
}

export function deactivate() {
	console.log('Deactivate.');
}

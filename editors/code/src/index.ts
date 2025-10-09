import * as vscode from 'vscode';
import { AddConnectionPanel } from './panels/addConnection';
import { SystemConnectionProvider } from 'adapters/connectionProvider';
import { ConnectionTreeProvider } from 'views/connectionTree';
import type { SystemConnection } from 'core';
import { EditConnectionPanel } from 'panels/editConnection';

export async function activate(context: vscode.ExtensionContext) {
	let systemProvider = new SystemConnectionProvider(context.workspaceState);

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

export function deactivate() {}

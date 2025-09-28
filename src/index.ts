import * as vscode from 'vscode';
import { AddConnectionPanel } from './views/addConnection';

export function activate(context: vscode.ExtensionContext) {
	const connection = { id: 'conn1', host: 'localhost', port: 2000000 };
	context.workspaceState.update('connections', [connection]);

	const connections = context.workspaceState.get('connections') || [];
	console.log('????aaaaa???');
	console.log(connections);

	context.subscriptions.push(
		vscode.commands.registerCommand('abap.openAddConnectionScreen', () => {
			AddConnectionPanel.render(context);
		}),
	);

	console.log('Extension activated.');
}

export function deactivate() {}

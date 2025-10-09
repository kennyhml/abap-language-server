import * as vscode from 'vscode';
import { AddConnectionPanel } from './panels/addConnection';
import { SystemConnectionProvider } from 'adapters/connectionProvider';

export async function activate(context: vscode.ExtensionContext) {
	let systemProvider = new SystemConnectionProvider(context.workspaceState);

	context.subscriptions.push(
		vscode.commands.registerCommand('abap.openAddConnectionScreen', () => {
			AddConnectionPanel.render(context, systemProvider);
		}),
	);

	console.log('Extension activated.');
}

export function deactivate() {}

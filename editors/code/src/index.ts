import * as vscode from 'vscode';
import { AddConnectionPanel } from './views/addConnection';
import { ConnectionTreeProvider } from './views/connectionProvider';

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

	console.log('Extension activated.');
}

export function deactivate() {}

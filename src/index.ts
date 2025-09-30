import * as vscode from 'vscode';
import { AddConnectionPanel } from './views/addConnection';
import { SystemTreeProvider } from './views/connectionProvider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('abap.openAddConnectionScreen', () => {
			AddConnectionPanel.render(context);
		}),
	);
	vscode.window.registerTreeDataProvider(
		'systems',
		new SystemTreeProvider(context),
	);

	console.log('Extension activated.');
}

export function deactivate() {}

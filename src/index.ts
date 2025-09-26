import * as vscode from 'vscode';
import { AddConnectionPanel } from './views/addConnection';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('abap.openAddConnectionScreen', () => {
			AddConnectionPanel.render(context);
		}),
	);

	console.log('Extension activated.');
}

export function deactivate() {}

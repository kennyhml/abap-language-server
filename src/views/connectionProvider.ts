import * as vscode from 'vscode';
import type { Connection, System } from '../connections';
import path from 'path';

export class ConnectionTreeProvider implements vscode.TreeDataProvider<System> {
	constructor(private context: vscode.ExtensionContext) {}

	getTreeItem(element: System): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(
			element.displayName,
			vscode.TreeItemCollapsibleState.None,
		);

		treeItem.label = element.displayName ?? '-';
		treeItem.tooltip = `Connection: ${element.displayName}`;
		treeItem.description = element.description;
		treeItem.iconPath = path.join(
			this.context.extensionPath,
			'webviews',
			'assets',
			element.landscapeProviderUrl ? 'systemSynced.svg' : 'systemNoSync.svg',
		);
		treeItem.contextValue = 'disconnected';
		treeItem.description = 'A description';

		return treeItem;
	}

	getChildren(element?: System): Thenable<System[]> {
		if (!element) {
			const connections =
				this.context.workspaceState.get<System[]>('connections') || [];
			return Promise.resolve(connections);
		}
		return Promise.resolve([]);
	}
}

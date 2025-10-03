import * as vscode from 'vscode';
import type { Connection } from 'types/connection';
import path from 'path';

export class ConnectionTreeProvider
	implements vscode.TreeDataProvider<Connection>
{
	constructor(private context: vscode.ExtensionContext) {}

	getTreeItem(element: Connection): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(
			element.name,
			vscode.TreeItemCollapsibleState.None,
		);

		treeItem.label = element.displayName ?? '-';
		treeItem.tooltip = `Connection: ${element.name}`;
		treeItem.description = element.description;
		treeItem.iconPath = path.join(
			this.context.extensionPath,
			'webviews',
			'assets',
			element.wasPredefined ? 'systemSynced.svg' : 'systemNoSync.svg',
		);
		treeItem.contextValue = 'disconnected';
		treeItem.description = 'A description';

		return treeItem;
	}

	getChildren(element?: Connection): Thenable<Connection[]> {
		if (!element) {
			const connections =
				this.context.workspaceState.get<Connection[]>('connections') || [];
			return Promise.resolve(connections);
		}
		return Promise.resolve([]);
	}
}

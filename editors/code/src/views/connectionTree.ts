import * as vscode from 'vscode';
import type {
	SystemConnection,
	SystemConnectionProvider,
} from '../systemConnection';
import path from 'path';

export class ConnectionTreeProvider
	implements vscode.TreeDataProvider<SystemConnection>
{
	constructor(
		private context: vscode.ExtensionContext,
		private connectionProvider: SystemConnectionProvider,
	) {}

	getTreeItem(element: SystemConnection): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(
			element.name,
			vscode.TreeItemCollapsibleState.None,
		);

		treeItem.label = element.name ?? '-';
		treeItem.tooltip = `Connection: ${element.name}`;
		treeItem.description = element.description;
		treeItem.contextValue = element.state ?? '';
		treeItem.iconPath = path.join(
			this.context.extensionPath,
			'webviews',
			'assets',
			element.landscapeProviderUrl ? 'systemSynced.svg' : 'systemNoSync.svg',
		);

		return treeItem;
	}

	getChildren(element?: SystemConnection): Thenable<SystemConnection[]> {
		if (!element) {
			return Promise.resolve(this.connectionProvider.connections);
		}
		return Promise.resolve([]);
	}
}

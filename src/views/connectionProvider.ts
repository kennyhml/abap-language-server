import * as vscode from 'vscode';
import type { Connection } from 'types/connection';
import path from 'path';

export class SystemTreeProvider implements vscode.TreeDataProvider<Connection> {
	constructor(private context: vscode.ExtensionContext) {}

	getTreeItem(element: Connection): vscode.TreeItem {
		if ((element as any).childrenOf) {
			let data = (element as any).childrenOf;
		}

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
			element.displayName?.includes('W4T')
				? 'systemSynced.svg'
				: 'systemNoSync.svg',
		);
		treeItem.contextValue = 'connection';
		treeItem.description = 'A description';

		treeItem.command = {
			command: 'abap.addNewConnection',
			title: 'Open',
			arguments: [element],
		};

		return treeItem;
	}

	getChildren(element?: Connection): Thenable<Connection[]> {
		if (!element) {
			const connections =
				this.context.workspaceState.get<Connection[]>('connections') || [];
			return Promise.resolve(connections);
		}

		if (element.systemId) {
			return Promise.resolve({ childrenOf: element } as any as Connection[]);
		}
		return Promise.resolve([]);
	}
}

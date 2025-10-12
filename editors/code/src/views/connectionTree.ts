import { ConnectionProtocol, type ConnectionData } from 'core';
import type { ConnectionManager } from 'lib';
import path from 'path';
import {
	EventEmitter,
	type TreeDataProvider,
	type Event,
	type ExtensionContext,
	TreeItem,
	TreeItemCollapsibleState,
} from 'vscode';

export class ConnectionTreeProvider
	implements TreeDataProvider<ConnectionData>
{
	private _onDidChangeTreeData = new EventEmitter<ConnectionData | undefined>();
	readonly onDidChangeTreeData: Event<ConnectionData | undefined> =
		this._onDidChangeTreeData.event;

	constructor(
		private context: ExtensionContext,
		private connections: ConnectionManager,
	) {
		this.connections.onDidChangeConnection((_event) => {
			this._onDidChangeTreeData.fire(undefined);
		});
	}

	getTreeItem(element: ConnectionData): TreeItem {
		const treeItem = new TreeItem(element.name, TreeItemCollapsibleState.None);

		treeItem.label = element.name.toUpperCase();
		treeItem.tooltip = `Connection: ${element.name}`;
		treeItem.iconPath = path.join(
			this.context.extensionPath,
			'webviews',
			'assets',
			element.landscapeProviderUrl ? 'systemSynced.svg' : 'systemNoSync.svg',
		);
		if (this.connections.getActive(element.systemId)) {
			treeItem.contextValue = 'connected';
		} else {
			treeItem.contextValue = 'disconnected';
		}

		/// [Protocol - Client - language]
		let descriptionString = '';
		if (element.params.protocol === ConnectionProtocol.Rfc) {
			descriptionString += '[RFC]: ';
		} else {
			if (element.params.ssl) {
				descriptionString += '[HTTPS]: ';
			} else {
				descriptionString += '[HTTP]: ';
			}
		}
		descriptionString += `${element.systemId} (${element.params.client}, '${element.params.language}')`;
		treeItem.description = descriptionString.toUpperCase();
		return treeItem;
	}

	getChildren(element?: ConnectionData): Thenable<ConnectionData[]> {
		if (!element) {
			return Promise.resolve(this.connections.getAllData());
		}
		return Promise.resolve([]);
	}
}

import { ConnectionProtocol, type SystemConnection } from 'core';
import path from 'path';
import type { SystemConnectionProvider } from 'adapters/connectionProvider';
import {
	EventEmitter,
	type TreeDataProvider,
	type Event,
	type ExtensionContext,
	TreeItem,
	TreeItemCollapsibleState,
} from 'vscode';

export class ConnectionTreeProvider
	implements TreeDataProvider<SystemConnection>
{
	private _onDidChangeTreeData: EventEmitter<
		SystemConnection | undefined | null | void
	> = new EventEmitter<SystemConnection | undefined | null | void>();
	readonly onDidChangeTreeData: Event<
		SystemConnection | undefined | null | void
	> = this._onDidChangeTreeData.event;

	constructor(
		private context: ExtensionContext,
		private connectionProvider: SystemConnectionProvider,
	) {
		this.connectionProvider.onDidChangeSystems(() => {
			this._onDidChangeTreeData.fire();
		});
	}

	getTreeItem(element: SystemConnection): TreeItem {
		const treeItem = new TreeItem(element.name, TreeItemCollapsibleState.None);

		treeItem.label = element.name.toUpperCase();
		treeItem.tooltip = `Connection: ${element.name}`;
		treeItem.contextValue = element.state ?? '';
		treeItem.iconPath = path.join(
			this.context.extensionPath,
			'webviews',
			'assets',
			element.landscapeProviderUrl ? 'systemSynced.svg' : 'systemNoSync.svg',
		);
		treeItem.contextValue = element.state ?? '';

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

	getChildren(element?: SystemConnection): Thenable<SystemConnection[]> {
		if (!element) {
			return Promise.resolve(this.connectionProvider.connections);
		}
		return Promise.resolve([]);
	}
}

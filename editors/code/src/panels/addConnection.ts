import {
	MessageChannel,
	type ConnectionPanelMessages,
	type LandscapeSystem,
} from 'core';
import type { ConnectionManager } from 'lib';
import path from 'path';
import type { Disposable, ExtensionContext, WebviewPanel } from 'vscode';
import * as vscode from 'vscode';
import { ViewColumn, window } from 'vscode';

export class AddConnectionPanel {
	private disposables: Disposable[] = [];
	private panel: WebviewPanel;
	private messageChannel: MessageChannel<ConnectionPanelMessages>;
	private static instance: AddConnectionPanel | undefined;

	private constructor(
		private connections: ConnectionManager,
		context: ExtensionContext,
	) {
		this.panel = window.createWebviewPanel(
			'addConnection',
			'Add System Connection',
			ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
				retainContextWhenHidden: true,
			},
		);
		const iconPath = vscode.Uri.file(
			path.join(context.extensionPath, 'webviews/assets/', 'addConnection.svg'),
		);
		this.panel.iconPath = iconPath;
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
		this.panel.webview.html = __getWebviewHtml__({
			serverUrl: `${process.env.VITE_DEV_SERVER_URL}webviews/addConnection.html`,
			webview: this.panel.webview,
			context,
			inputName: 'addConnection',
		});

		this.messageChannel = new MessageChannel({
			dispatch: (message) => this.panel.webview.postMessage(message),
			listen: (listener) =>
				this.panel.webview.onDidReceiveMessage(
					listener,
					null,
					this.disposables,
				),
		});

		this.messageChannel.onDidReceive('getLandscape', async (data) => {
			console.log(`Landscape requested for ${data.protocol}`);
			let connections: LandscapeSystem[] = [];
			return connections;
		});

		this.messageChannel.onDidReceive('doTest', async (data) => {
			return await this.connections.testConnect(data.connection);
		});

		this.messageChannel.onDidReceive('doAdd', async (data) => {
			try {
				this.connections.addGlobalConnection(data.connection);
				return { success: true, message: 'Connection added' };
			} catch (err: any) {
				return { success: false, message: err.message };
			}
		});
	}

	public static render(
		context: ExtensionContext,
		connections: ConnectionManager,
	) {
		if (this.instance) {
			this.instance.panel.reveal(ViewColumn.One);
		} else {
			this.instance = new AddConnectionPanel(connections, context);
		}
	}

	/**
	 * Cleans up and disposes of webview resources when the webview panel is closed.
	 */
	public dispose() {
		AddConnectionPanel.instance = undefined;

		this.panel.dispose();
		while (this.disposables.length) {
			const disposable = this.disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}

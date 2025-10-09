import type { SystemConnectionProvider } from 'adapters/connectionProvider';
import {
	MessageChannel,
	type EditConnectionMessages,
	type SystemConnection,
} from 'core';
import path from 'path';
import type { Disposable, ExtensionContext, WebviewPanel } from 'vscode';
import * as vscode from 'vscode';
import { ViewColumn, window } from 'vscode';

export class EditConnectionPanel {
	private disposables: Disposable[] = [];
	private panel: WebviewPanel;
	private messageChannel: MessageChannel<EditConnectionMessages>;
	private static instance: EditConnectionPanel | undefined;

	private constructor(
		private connectionProvider: SystemConnectionProvider,
		private connectionToEdit: SystemConnection,
		context: ExtensionContext,
	) {
		this.panel = window.createWebviewPanel(
			'editConnection',
			'Edit System Connection',
			ViewColumn.Beside,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
				retainContextWhenHidden: true,
			},
		);
		const iconPath = vscode.Uri.file(
			path.join(
				context.extensionPath,
				'webviews/assets/',
				'editConnection.svg',
			),
		);
		this.panel.iconPath = iconPath;
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
		this.panel.webview.html = __getWebviewHtml__({
			serverUrl: `${process.env.VITE_DEV_SERVER_URL}webviews/editConnection.html`,
			webview: this.panel.webview,
			context,
			inputName: 'editConnection',
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

		this.messageChannel.onDidReceive('doEdit', async (data) => {
			if (data.test) {
				return await this.connectionProvider.testConnection(data.connection);
			} else {
				return await this.connectionProvider.updateConnection(
					this.connectionToEdit.name,
					data.connection,
				);
			}
		});

		this.messageChannel.send('initialize', { connection: connectionToEdit });
	}

	public static render(
		context: ExtensionContext,
		connectionToEdit: SystemConnection,
		connectionProvider: SystemConnectionProvider,
	) {
		if (this.instance) {
			this.instance.panel.reveal(ViewColumn.One);
		} else {
			this.instance = new EditConnectionPanel(
				connectionProvider,
				connectionToEdit,
				context,
			);
		}
	}

	/**
	 * Cleans up and disposes of webview resources when the webview panel is closed.
	 */
	public dispose() {
		EditConnectionPanel.instance = undefined;

		this.panel.dispose();
		while (this.disposables.length) {
			const disposable = this.disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}

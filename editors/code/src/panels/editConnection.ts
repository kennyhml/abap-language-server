import {
	MessageChannel,
	type ConnectionData,
	type EditConnectionMessages,
} from 'core';
import type { ConnectionManager } from 'lib';
import path from 'path';
import type { Disposable, ExtensionContext, WebviewPanel } from 'vscode';
import * as vscode from 'vscode';
import { ViewColumn, window } from 'vscode';

export class EditConnectionPanel implements Disposable {
	private disposables: Disposable[] = [];
	private panel: WebviewPanel;
	private messageChannel: MessageChannel<EditConnectionMessages>;

	private constructor(
		private connections: ConnectionManager,
		private connectionToEdit: ConnectionData,
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
			try {
				this.connections.updateGlobalConnection(
					this.connectionToEdit,
					data.connection,
				);
				return { success: true, message: 'Connection added' };
			} catch (err: any) {
				return { success: false, message: err.message };
			}
		});

		this.messageChannel.onDidReceive('doTest', async (data) => {
			return await this.connections.testConnect(data.connection);
		});

		setTimeout(() => {
			this.messageChannel.send('initialize', { connection: connectionToEdit });
		}, 1000);
	}

	public static async render(
		context: ExtensionContext,
		connectionToEdit: ConnectionData,
		connections: ConnectionManager,
	) {
		let layout = (await vscode.commands.executeCommand(
			'vscode.getEditorLayout',
		)) as any;

		// Only if there is only a single panel open we will split into two
		// columns to open the view to the right side. Ideally, we would
		// somehow open it on the left to be closer to the side panel..
		if (layout.groups.length === 1 && layout.orientation === 1) {
			await vscode.commands.executeCommand('vscode.setEditorLayout', {
				orientation: 0,
				groups: [
					{ groups: [{}], size: 0.5 },
					{ groups: [{}], size: 0.5 },
				],
			});
		}
		new EditConnectionPanel(connections, connectionToEdit, context);
	}

	/**
	 * Cleans up and disposes of webview resources when the webview panel is closed.
	 */
	public dispose() {
		this.panel.dispose();
		while (this.disposables.length) {
			const disposable = this.disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}

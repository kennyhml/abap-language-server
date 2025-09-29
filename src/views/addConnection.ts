import {
	ConnectionTypes,
	SecurityLevel,
	type Connection,
} from 'types/connection';
import type { Disposable, ExtensionContext, WebviewPanel } from 'vscode';
import * as vscode from 'vscode';
import { ViewColumn, window } from 'vscode';

export class AddConnectionPanel {
	public static currentPanel: AddConnectionPanel | undefined;
	private readonly _panel: WebviewPanel;
	private _disposables: Disposable[] = [];

	private constructor(panel: WebviewPanel, context: ExtensionContext) {
		this._panel = panel;

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.webview.html = __getWebviewHtml__({
			serverUrl: `${process.env.VITE_DEV_SERVER_URL}webviews/addConnection.html`,
			webview: this._panel.webview,
			context,
			inputName: 'addConnection',
		});

		this._panel.webview.onDidReceiveMessage(
			(message: any) => {
				if (message.type === 'onSubmit') {
					let conn = message.connection as Connection;
					let interactionId = message.interactionId as string;
					this._panel.webview.postMessage({
						interactionId,
						data: { foo: 'bar', ...conn },
					});
				} else if (message.type === 'getConnections') {
					let interactionId = message.interactionId as string;
					this._panel.webview.postMessage({
						interactionId,
						data: this.getAvailableConnections()
					});

				}
			},
			undefined,
			this._disposables,
		);
	}

	public static render(context: ExtensionContext) {
		if (AddConnectionPanel.currentPanel) {
			AddConnectionPanel.currentPanel._panel.reveal(ViewColumn.One);
		} else {
			const panel = window.createWebviewPanel(
				'addSystemConnection',
				'Add System Connection',
				ViewColumn.One,
				{
					enableScripts: true,
					localResourceRoots: [
						vscode.Uri.joinPath(context.extensionUri, 'dist'),
					],
					retainContextWhenHidden: true,
				},
			);
			AddConnectionPanel.currentPanel = new AddConnectionPanel(panel, context);
		}
	}

	/**
	 * Cleans up and disposes of webview resources when the webview panel is closed.
	 */
	public dispose() {
		AddConnectionPanel.currentPanel = undefined;

		// Dispose of the current webview panel
		this._panel.dispose();

		// Dispose of all disposables (i.e. commands) for the current webview panel
		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}

	private getAvailableConnections() {
		let connections: Connection[] = [];
		for (let i = 0; i < 30; i++) {
			connections.push({
				systemId: `W${i}D`,
				name: '',
				displayName: '',
				description: '',
				connectionType: ConnectionTypes.CustomApplicationServer,
				applicationServer: '',
				instanceNumber: '',
				sapRouterString: '',
				sncEnabled: true,
				ssoEnabled: true,
				sncName: '',
				sncLevel: SecurityLevel.Encrypted,
				keepSynced: true,
				wasPredefined: true,
			});
		}
		return connections;
	}
}

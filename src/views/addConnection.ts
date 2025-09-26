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
}

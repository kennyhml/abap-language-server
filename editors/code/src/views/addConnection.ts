import {
	type LandscapeSystem,
	type SubmissionResult,
	type System,
} from 'connections';
import { createClient } from 'languageClient';
import type { Disposable, ExtensionContext, WebviewPanel } from 'vscode';
import * as vscode from 'vscode';
import { ViewColumn, window } from 'vscode';

export class AddConnectionPanel {
	public static currentPanel: AddConnectionPanel | undefined;
	private readonly _panel: WebviewPanel;
	private context: vscode.ExtensionContext;
	private _disposables: Disposable[] = [];

	private constructor(panel: WebviewPanel, context: ExtensionContext) {
		this._panel = panel;
		this.context = context;

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.webview.html = __getWebviewHtml__({
			serverUrl: `${process.env.VITE_DEV_SERVER_URL}webviews/addConnection.html`,
			webview: this._panel.webview,
			context,
			inputName: 'addConnection',
		});

		this._panel.webview.onDidReceiveMessage(
			async (message: any) => {
				if (message.type === 'onSubmit' || message.type === 'onTest') {
					let conn = JSON.parse(message.connection) as System;
					let interactionId = message.interactionId as string;

					let result = await this.connectionSubmitted(
						conn,
						message.type === 'onTest',
					);
					console.log('Result:', result);
					this._panel.webview.postMessage({
						interactionId,
						...result,
					});
				} else if (message.type === 'getConnections') {
					let interactionId = message.interactionId as string;
					this._panel.webview.postMessage({
						interactionId,
						data: this.getAvailableConnections(),
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
		let connections: LandscapeSystem[] = [];
		return connections;
	}

	public async connectionSubmitted(
		system: System,
		test?: boolean,
	): Promise<SubmissionResult> {
		console.log(
			`System: '${system.systemId}', data: '${JSON.stringify(system)}'`,
		);

		let client = await createClient(system, { silent: true });

		try {
			await client.start();
			await client.stop();
			client.outputChannel.dispose();
		} catch (e: any) {
			console.error(e);
			client.dispose().catch((e) => {
				console.error('Could not dispose: ', e);
			});
			// client.outputChannel.dispose();
			return {
				success: false,
				message: e.message ?? 'Unknown error.',
			};
		}
		if (test) {
			return {
				success: true,
				message: 'Connection is valid.',
			};
		}

		let data = this.context.workspaceState.get('systems');
		let systems = (data ?? []) as System[];
		systems.push(system);
		this.context.workspaceState.update('systems', systems);
		return {
			success: true,
			message: 'System added to workspace',
		};
	}
}

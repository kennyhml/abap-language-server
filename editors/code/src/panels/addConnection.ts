import {
	type WebviewMessage,
	type MessageChannel,
	generateInteractionId,
	type ConnectionPanelMessages,
} from 'core';
import {
	SystemConnectionProvider,
	type LandscapeSystem,
} from '../systemConnection';
import type { Disposable, ExtensionContext, WebviewPanel } from 'vscode';
import * as vscode from 'vscode';
import { type Webview } from 'vscode';
import { ViewColumn, window } from 'vscode';

class PannelMessageChannel<T extends WebviewMessage<string, any, any>>
	implements MessageChannel<T>
{
	private messageHandlers: {
		[K in T['kind']]: (
			msg: Extract<T, { kind: K }>['data'],
		) => Promise<Extract<T, { kind: K }>['response']>;
	};

	private recvListenerDisposable?: Disposable;

	constructor(private webview: Webview) {
		this.messageHandlers = {} as any;
	}

	send<const K extends T['kind']>(
		kind: K,
		data: Extract<T, { kind: K }>['data'],
	): Promise<Extract<T, { kind: K }>['response']> {
		const interactionId = generateInteractionId();
		this.webview.postMessage({
			kind,
			data: JSON.stringify(data),
			interactionId,
		});

		return new Promise((resolve, reject) => {
			const handleMessage = (msg) => {
				if (msg.interactionId !== interactionId) {
					return;
				}
				disposable.dispose();
				resolve(msg);
			};
			let disposable = this.webview.onDidReceiveMessage(handleMessage);

			setTimeout(() => {
				disposable.dispose();
				reject(new Error('No response received from extension'));
			}, 9999);
		});
	}

	onDidReceive<const K extends T['kind']>(
		kind: K,
		callback: (
			data: Extract<T, { kind: K }>['data'],
		) => Promise<Extract<T, { kind: K }>['response']>,
	): void {
		// If not done already, register a listener for new messages to dispatch
		// the callbacks to. We dont have to worry about this accidentally responding
		// to what is already a response, since a response should not include a kind field.
		if (!this.recvListenerDisposable) {
			this.recvListenerDisposable = this.webview.onDidReceiveMessage((msg) => {
				let callback = this.messageHandlers[msg.kind as T['kind']];
				if (!callback) {
					console.warn('No callback for ', msg.kind ?? msg);
					return;
				}
				console.log(`Received Message: ${JSON.stringify(msg, null, 2)}`);
				callback(JSON.parse(msg.data))
					.then((response) => {
						this.webview.postMessage({
							data: response,
							interactionId: msg.interactionId,
						});
					})
					.catch(console.error);
			});
		}
		this.messageHandlers[kind] = callback;
	}
}

export class AddConnectionPanel {
	private disposables: Disposable[] = [];
	private panel: WebviewPanel;
	private messageChannel: PannelMessageChannel<ConnectionPanelMessages>;
	private static instance: AddConnectionPanel | undefined;

	private constructor(
		private connectionProvider: SystemConnectionProvider,
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
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
		this.panel.webview.html = __getWebviewHtml__({
			serverUrl: `${process.env.VITE_DEV_SERVER_URL}webviews/addConnection.html`,
			webview: this.panel.webview,
			context,
			inputName: 'addConnection',
		});

		this.messageChannel = new PannelMessageChannel(this.panel.webview);

		this.messageChannel.onDidReceive('getLandscape', async (data) => {
			console.log(`Landscape requested for ${data.protocol}`);
			let connections: LandscapeSystem[] = [];
			return connections;
		});

		this.messageChannel.onDidReceive('connectionSubmit', async (data) => {
			console.log(
				`Received ${data.connection.name}, test: ${data.test ?? false}`,
			);
			return await this.connectionProvider.testConnection(data.connection);
		});
	}

	public static render(
		context: ExtensionContext,
		connectionProvider: SystemConnectionProvider,
	) {
		if (this.instance) {
			this.instance.panel.reveal(ViewColumn.One);
		} else {
			this.instance = new AddConnectionPanel(connectionProvider, context);
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

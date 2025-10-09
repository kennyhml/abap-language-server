import {
	generateInteractionId,
	type WebviewMessage,
	type MessageChannel,
} from 'extension';
import type { WebviewApi } from 'vscode-webview';

export class WebviewMessageChannel<T extends WebviewMessage<string, any, any>>
	implements MessageChannel<T>
{
	private messageHandlers: {
		[K in T['kind']]: (
			msg: Extract<T, { kind: K }>['data'],
		) => Promise<Extract<T, { kind: K }>['response']>;
	};
	private addedListener: boolean = false;

	constructor(private vscode: WebviewApi<unknown>) {
		this.messageHandlers = {} as any;
	}

	send<const K extends T['kind']>(
		kind: K,
		data: Extract<T, { kind: K }>['data'],
	): Promise<Extract<T, { kind: K }>['response']> {
		const interactionId = generateInteractionId();
		this.vscode.postMessage({
			kind,
			data: JSON.stringify(data),
			interactionId,
		});

		return new Promise((resolve, reject) => {
			const handleMessage = (event: MessageEvent<any>) => {
				if (event.data.interactionId !== interactionId) {
					return;
				}
				window.removeEventListener('message', handleMessage);
				console.log('Received response: ', event);
				resolve(event.data.data);
			};
			window.addEventListener('message', handleMessage);

			setTimeout(() => {
				window.removeEventListener('message', handleMessage);
				reject(new Error('No response received from extension'));
			}, 10000);
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
		if (this.addedListener) {
			this.addedListener = true;
			window.addEventListener('message', (msg) => {
				let callback = this.messageHandlers[msg.data.kind as T['kind']];
				if (!callback) {
					console.warn('No callback for ', msg.data.kind ?? msg);
					return;
				}
				console.log(`Received Message: ${JSON.stringify(msg, null, 2)}`);
				callback(JSON.parse(msg.data))
					.then((response) => {
						this.vscode.postMessage({
							response,
							interactionId: msg.data.interactionId,
						});
					})
					.catch(console.error);
			});
		}
		this.messageHandlers[kind] = callback;
	}
}

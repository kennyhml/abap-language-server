import type {
	ConnectionProtocol,
	LandscapeSystem,
	SystemConnection,
} from './connection';

export const generateInteractionId = () =>
	Math.floor(Math.random() * (1236778171 - 102303210 + 1)) + 102303210;

export type WebviewMessage<K extends string, D, R = void> = {
	kind: K;
	interactionId: string;
	data: D;
	response: R;
};

export class MessageChannel<T extends WebviewMessage<string, any, any>> {
	private handlers: {
		[K in T['kind']]: (
			msg: Extract<T, { kind: K }>['data'],
		) => Promise<Extract<T, { kind: K }>['response']>;
	};

	private pendingPromises: Map<
		number,
		{
			resolve: (value: any) => void;
			reject: (reason?: any) => void;
			timeout: NodeJS.Timeout;
		}
	>;

	constructor(
		private callbacks: {
			dispatch: (message: any) => void;
			listen: (listener: (message: any) => void) => void;
		},
	) {
		this.handlers = {} as any;
		this.pendingPromises = new Map();
		this.setupListener();
	}

	send<const K extends T['kind']>(
		kind: K,
		data: Extract<T, { kind: K }>['data'],
	): Promise<Extract<T, { kind: K }>['response']> {
		const interactionId = generateInteractionId();
		this.callbacks.dispatch({
			kind,
			data: JSON.stringify(data),
			interactionId,
		});

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.pendingPromises.delete(interactionId);
				reject(new Error('No response received from extension'));
			}, 9999);

			this.pendingPromises.set(interactionId, { resolve, reject, timeout });
			console.log(`Added pending promise: ${interactionId}`);
		});
	}

	onDidReceive<const K extends T['kind']>(
		kind: K,
		callback: (
			data: Extract<T, { kind: K }>['data'],
		) => Promise<Extract<T, { kind: K }>['response']>,
	): void {
		this.handlers[kind] = callback;
	}

	private setupListener() {
		this.callbacks.listen((msg) => {
			// Is it a response to a pending promise?
			const pending = this.pendingPromises.get(msg.interactionId);
			if (pending) {
				console.log(`Received Response: ${JSON.stringify(msg, null, 2)}`);
				clearTimeout(pending.timeout);
				this.pendingPromises.delete(msg.interactionId);

				// Resolve the promise to the data only, this response ends up back
				// at the initial caller and they should only expect the data.
				pending.resolve(msg.data);
				return;
			}

			// Start of a new interaction.
			let callback = this.handlers[msg.kind as T['kind']];
			if (!callback) {
				console.warn('No callback for ', msg.kind ?? msg);
				return;
			}
			console.log(`Received Message: ${JSON.stringify(msg, null, 2)}`);
			callback(JSON.parse(msg.data))
				.then((response) => {
					this.callbacks.dispatch({
						data: response,
						interactionId: msg.interactionId,
					});
				})
				.catch(console.error);
		});
	}
}

export type ConnectionPanelMessages =
	| WebviewMessage<
			'getLandscape',
			{ protocol: ConnectionProtocol },
			LandscapeSystem[]
	  >
	| WebviewMessage<
			'connectionSubmit',
			{ connection: SystemConnection; test?: boolean },
			{ success: boolean; message: string }
	  >;

export type EditConnectionMessages =
	| WebviewMessage<
			'doEdit',
			{ connection: SystemConnection; test?: boolean },
			{ success: boolean; message: string }
	  >
	| WebviewMessage<'initialize', { connection: SystemConnection }, void>;

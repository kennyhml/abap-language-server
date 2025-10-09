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

export interface MessageChannel<T extends WebviewMessage<string, any, any>> {
	send<const K extends T['kind']>(
		kind: K,
		data: Extract<T, { kind: K }>['data'],
	): Promise<Extract<T, { kind: K }>['response']>;

	onDidReceive<const K extends T['kind']>(
		kind: K,
		callback: (
			data: Extract<T, { kind: K }>['data'],
		) => Promise<Extract<T, { kind: K }>['response']>,
	): void;
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

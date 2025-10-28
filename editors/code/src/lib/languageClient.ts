import {
	CloseAction,
	ErrorAction,
	LanguageClient,
	type CloseHandlerResult,
	type ErrorHandler,
	type ErrorHandlerResult,
} from 'vscode-languageclient/node';
import { window, workspace } from 'vscode';
import { type ConnectionData } from 'core';
import type { LanguageServerMethods } from 'core/lsp';
import { establishServerConnection } from 'core/client';
import { ADT_URI_SCHEME } from './uri';
import type { Socket } from 'net';

class ClientErrorHandler implements ErrorHandler {
	error(error: Error, message: any, count: number): ErrorHandlerResult {
		console.error('Language server error:', error, message, `Attempt ${count}`);
		return { handled: true, action: ErrorAction.Continue };
	}

	closed(): CloseHandlerResult {
		console.warn('Language server connection closed.');
		return { handled: true, action: CloseAction.DoNotRestart };
	}
}

export class AbapLanguageClient extends LanguageClient {
	public static async connect(
		data: ConnectionData,
		restore?: boolean,
	): Promise<AbapLanguageClient> {
		let socket = await establishServerConnection();
		let client = new AbapLanguageClient(data.systemId, socket);

		try {
			await client.start();
			await client.invokeCustom('connection/connect', {
				...data.params,
				systemId: data.systemId,
				restore: restore ?? false,
				authentication: {
					kind: 'password',
					username: 'DEVELOPER',
					password: 'ABAPtr2022#01',
				},
			});
		} catch (err) {
			client.kill();
			throw err;
		}
		return client;
	}

	private constructor(system: string, private socket: Socket) {
		let ch = window.createOutputChannel(`${system} Language Server`, 'abap');
		const serverOptions = async () => ({
			writer: socket,
			reader: socket,
			detached: true,
		});
		super('abap', `${system} Language Server`, serverOptions, {
			outputChannel: ch,
			errorHandler: new ClientErrorHandler(),
			documentSelector: [{ scheme: ADT_URI_SCHEME, language: 'abap' }],
			synchronize: {
				fileEvents: workspace.createFileSystemWatcher('**/*.clas'),
			},
		});
	}

	public async invokeCustom<T extends keyof LanguageServerMethods>(
		method: T,
		params: LanguageServerMethods[T]['params'],
	): Promise<LanguageServerMethods[T]['result']> {
		return await this.sendRequest(method, params);
	}

	public async kill() {
		this.stop()
			.then(() => {
				console.log('Server has been stopped.');
			})
			.catch((err) => {
				console.error('Could not stop the server: ', err);
			});
		this.socket;
	}
}

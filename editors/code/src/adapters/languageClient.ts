import {
	CloseAction,
	ErrorAction,
	LanguageClient,
	type CloseHandlerResult,
	type ErrorHandler,
	type ErrorHandlerResult,
	type StreamInfo,
} from 'vscode-languageclient/node';
import { type LanguageClientOptions } from 'vscode-languageclient/node';
import * as vscode from 'vscode';
import { establishServerConnection } from 'core/client';

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

let client: LanguageClient;

/**
 * Creates a language client for use, this really only makes sure the server is
 * running and we have a TCP connection to it.
 */
export async function getLanguageClient(): Promise<LanguageClient> {
	let ch = vscode.window.createOutputChannel('ABAP Language Server', 'abap');
	let clientOptions: LanguageClientOptions = {
		outputChannel: ch,
		errorHandler: new ClientErrorHandler(),
	};

	let serverOptions = async (): Promise<StreamInfo> => {
		let socket = await establishServerConnection();
		return { writer: socket, reader: socket, detached: true };
	};

	client = new LanguageClient(
		'abap',
		`ABAP Language Server`,
		serverOptions,
		clientOptions,
	);
	return client;
}

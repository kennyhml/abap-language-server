/**
 * Core language client functionality, no vscode specific stuff.
 */
import child_process from 'child_process';
import { connect, type Socket } from 'net';
import psList from 'ps-list';

/**
 * Path of the language server on the filesystem,
 *
 * For debug mode specified by the `ABAP_LSP_SERVER_DEBUG` environment variable.
 */
export function getLanguageServerPath(): string {
	return (
		process.env['__ABAP_LSP_SERVER_DEBUG'] ??
		'C:/dev/abap-lsp/target/debug/abap-lsp.exe'
	);
}

/**
 * Establishes a connection with the Language Server via TCP.
 *
 * Connecting via TCP is required because the server may outlive the lifecycle
 * of the extension in order to enable persisting state across short reload periods.
 *
 * As such there has to be an agreed upon port to use which may need to be configurable.
 *
 * The function will first try to connect to the corresponding socket and only then
 * will it launch the language server binary if it could not connect initially.
 *
 * The language server is launched in orphan mode, meaning it wont automatically shut
 * down when vscode or the extension does, thus the server itself has to make sure to
 * terminate when it does not receive any messages.
 */
export async function establishServerConnection(): Promise<Socket> {
	console.log('Establishing connection to language server..');
	const port = 9257;
	const hostname = '127.0.0.1';

	let connection = await tryConnectToSocket(hostname, port);
	if (connection) {
		console.log('Connection established, server was already running.');
		return connection;
	}

	await spawnLanguageServer();
	connection = await tryConnectToSocket(hostname, port);
	if (!connection) {
		throw Error('Could not spawn & connect to language server.');
	}
	return connection;
}

export async function isLanguageServerRunning(): Promise<boolean> {
	const processList = await psList();
	const name = getLanguageServerPath().split('/').pop();
	return processList.some((process) => process.name === name);
}

/**
 * Tries to connect to the socket of the language server.
 *
 * @param host
 * @param port
 *
 * @returns Either the `Socket` if the connection succeeded or `undefined`.
 */
async function tryConnectToSocket(
	host: string,
	port: number,
): Promise<Socket | undefined> {
	const connection = connect({ port, host });

	return new Promise((resolve, reject) => {
		connection.on('connect', () => {
			resolve(connection);
		});
		connection.on('error', (err: any) => {
			if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
				resolve(undefined);
			} else {
				reject(err);
			}
		});
	});
}

/**
 * Spawns the language server process and makes sure that it is not coupled
 * to the vscode/extension host process so that state can persist, at least
 * temporarily.
 *
 * ### WARNING:
 * The process will still be part of the process tree, the OS just
 * wont terminate it when the main process terminates, but stopping the VSC
 * debugger WILL ALWAYS do it, the only way around it is to close the vscode
 * window itself instead of stopping the debugger.
 */
async function spawnLanguageServer() {
	let target = getLanguageServerPath();
	console.log(`Spawning language server at ${target}..`);

	const child = child_process.spawn(target, {
		detached: true,
		stdio: 'ignore',
		cwd: process.cwd(),
	});

	child.unref();
	await new Promise((f) => setTimeout(f, 1000));
}

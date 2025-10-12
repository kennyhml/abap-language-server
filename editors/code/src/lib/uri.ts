import type { ConnectionData } from 'core';
import { Uri } from 'vscode';

export const ADT_URI_SCHEME: string = 'adt';

export function getConnectionUri(connection: ConnectionData): Uri {
	return Uri.parse(`${ADT_URI_SCHEME}://${connection.systemId.toUpperCase()}`);
}

export function getTargetSystem(uri: Uri): string {
	return uri.authority.toUpperCase();
}

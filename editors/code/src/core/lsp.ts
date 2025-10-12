/**
 * Typedefs for the custom language server communication
 */

import type { ConnectionParams } from './connection';
import type { FilesystemNode } from './filesystem';

export type LanguageServerMethods = {
	'filesystem/expand': {
		params: { node: FilesystemNode };
		result: { children: FilesystemNode[] };
	};
	'connection/connect': {
		params: { systemId: string; authentication: any } & ConnectionParams;
		result: { kind: 'alreadyConnected' | 'created' };
	};
};

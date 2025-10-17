/**
 * Typedefs for the custom language server communication
 */

import type { ConnectionParams } from './connection';
import type { FilesystemNode, NodeId } from './filesystem';

export type LanguageServerMethods = {
	'filesystem/expand': {
		params: { id: NodeId };
		result: { children: FilesystemNode[] };
	};
	'connection/connect': {
		params: { systemId: string; authentication: any } & ConnectionParams;
		result: { kind: 'alreadyConnected' | 'created' };
	};
};

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
	'filesystem/source': {
		params: { id: NodeId; uri: string };
		result: { content: string };
	};
	'connection/connect': {
		params: {
			systemId: string;
			authentication: any;
			restore: boolean;
		} & ConnectionParams;
		result: { kind: 'alreadyConnected' | 'created' | 'restored' };
	};
};

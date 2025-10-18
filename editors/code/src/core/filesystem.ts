/**
 * Structures the different functionality / implication of a node in the filesystem.
 */
export const NodeType = {
	/**
	 * A {@link VirtualGrouping virtual grouping} to organize related objects.
	 */
	Group: 'group',

	Facet: 'facet',

	/**
	 * An actual {@link ObjectType repository object} such as a package or a class.
	 */
	RepositoryObject: 'repositoryObject',
} as const;

/**
 * Type of a repository object
 */
export type NodeType = (typeof NodeType)[keyof typeof NodeType];

export type NodeId = { idx: number; version: number };

/**
 * Represents a single node in the filsystem tree.
 *
 * Provides information about the node such as name, {@link ObjectType type } and other
 * useful properties to construct the virtual filesytem.
 *
 * To access the children of the node, you must first expand it with **`filesystem/expand`**.
 */
export type FilesystemNode = RepositoryObjectNode | GroupNode | FacetNode;

const UNICODE_FAKE_FORWARD_SLASH = ' ⁄ ';

/**
 * A node representing a repository object, e.g. a package or a class.
 */
export type RepositoryObjectNode = {
	kind: typeof NodeType.RepositoryObject;

	id: NodeId;

	name: string;

	/**
	 * The type of repository object such as `Package` or `Class`..
	 *
	 * Determines whether it can be expanded, how it will be displayed and opened.
	 */
	objectKind: String;
};

/**
 * A node representing a virtual grouping of related nodes, this abstraction only
 * exists in the filesystem and not in any true organizational means on the system.
 */
export type GroupNode = {
	kind: typeof NodeType.Group;

	id: NodeId;

	name: string;

	group: 'SYSTEM' | 'LOCAL_OBJECTS' | 'SYSTEM_LIBRARY' | 'FAVORITES';

	children?: FilesystemNode[];
};

export type FacetNode = {
	kind: typeof NodeType.Facet;

	id: NodeId;

	name: string;

	count: number;

	children?: FilesystemNode[];
};

export function newSystemRoot(systemId: string): GroupNode {
	return {
		kind: NodeType.Group,
		group: 'SYSTEM',
		name: systemId,
		id: { idx: 1, version: 1 },
	};
}

/**
 * @returns Whether the given node is a {@link GroupNode}.
 */
export function isGroup(node: FilesystemNode): node is GroupNode {
	return node.kind === NodeType.Group;
}

export function isFacet(node: FilesystemNode): node is FacetNode {
	return node.kind === NodeType.Facet;
}

/**
 * @returns Whether the given node is an {@link ObjectNode}.
 */
export function isSystem(
	node: FilesystemNode,
): node is GroupNode & { group: 'SYSTEM' } {
	return node.kind === NodeType.Group && node.group == 'SYSTEM';
}

/**
 * @returns Whether the given node is an {@link ObjectNode}.
 */
export function isObject(node: FilesystemNode): node is RepositoryObjectNode {
	return node.kind === NodeType.RepositoryObject;
}

export function walk(
	node: FilesystemNode,
	path: string[],
): FilesystemNode | undefined {
	let curr: FilesystemNode | undefined = node;
	for (const segment of path) {
		if (!curr || isObject(curr)) {
			break;
		}
		curr = curr?.children?.find((node) => node.name === segment);
	}
	return curr;
}

export function isExpandable(node: FilesystemNode) {
	return isGroup(node) || isFacet(node);
}

/**
 * Converts a node name to the external representation in the filesystem.
 *
 * For one, this means replacing slashes `/` with a fake unicode version as
 * they are not allowed in file/folder names. In the case of repository objects
 * that are not packages, the 4 letter identifier of the object type is also
 * added to the name of a suffix. For example, the program (`"PROG/P"`) __Z_TEST_PROGRAM__
 * is converted to __Z_TEST_PROGRAM.prog__.
 *
 * It is critical to reverse these modifications when resolving the node names
 * back to their internal representation that the server deals with.
 *
 * See {@link toRealName} for the opposite operation.
 *
 * @param node The node to return the external node name for.
 *
 * @returns A display name to use for the node in the filesystem.
 */
export function toDisplayName(node: FilesystemNode): string {
	return (
		node.name.replaceAll('/', UNICODE_FAKE_FORWARD_SLASH) + objectSuffix(node)
	);
}

/**
 * Converts a node name from the external representation back to its real name.
 *
 * Basically does the opposite of {@link toDisplayName}
 *
 * @param node The display name to return the real node name for.
 *
 * @returns The real (original) name of a node prior.
 */
export function toRealName(name: string): string {
	name = name.replaceAll(UNICODE_FAKE_FORWARD_SLASH, '/');
	// A dot should be illegal in file / package names, so if there is one we can safely
	// assume that it is because of our suffix.
	if (name.includes('.')) {
		name = name.substring(0, name.length - 5);
	}
	return name;
}

/**
 * Returns the suffix for any node that is a {@link RepositoryObject} but not a package.
 *
 * @param node The node to return the suffix for.
 *
 * @returns Depending on the concrete node type, either an empty string or a suffix to append.
 */
function objectSuffix(node: FilesystemNode): string {
	if (isObject(node)) {
		// TODO: Using the first 4 characters of the object name isnt ideal, alot of
		// different objects share it (e.g) PROG/P = program, PROG/I = Include, both are PROG.
		return '.' + node.objectKind.substring(0, 4).toLowerCase();
	}
	return '';
}

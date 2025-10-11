export const RepositoryObject = {
	/**
	 * Package, also referred to as `DEVC` or `devclass`.
	 */
	Package: 'DEVC/K',

	/**
	 * Executable Program
	 */
	Program: 'PROG/P',

	/**
	 * Program Include, also referred to as `INCL`
	 */
	Include: 'PROG/I',

	/**
	 * Interface (OOP Context)
	 */
	Interface: 'INTF/OI',

	/**
	 * Class (OOP Context)
	 */
	Class: 'CLAS/OC',
} as const;

/**
 * Type of a repository object
 */
export type RepositoryObject =
	(typeof RepositoryObject)[keyof typeof RepositoryObject];

/**
 * Structures the different functionality / implication of a node in the filesystem.
 */
export const NodeType = {
	/**
	 * The root node, takes the name of its system and has static components.
	 */
	Root: 'root',

	/**
	 * The system root node, while this is technically also a 'grouping', it needs to
	 * be treated differently because its name cant be known at compile time and it also
	 * has a constant set of children.
	 */
	System: 'system',

	/**
	 * A {@link VirtualGrouping virtual grouping} to organize related objects.
	 */
	Group: 'group',

	/**
	 * An actual {@link ObjectType repository object} such as a package or a class.
	 */
	Object: 'object',
} as const;

/**
 * Type of a repository object
 */
export type NodeType = (typeof NodeType)[keyof typeof NodeType];

export const VirtualGrouping = {
	Root: 'Root',
	Local: 'Local Objects',
	Favorites: 'Favorite Objects',
	System: 'System Library',
} as const;

/**
 * Valid groups to organize objects in the filesystem, must be known at compile
 * as certain folder icons are also determined based on predefined folder names.
 */
export type VirtualGrouping =
	(typeof VirtualGrouping)[keyof typeof VirtualGrouping];

/**
 * Represents a single node in the filsystem tree.
 *
 * Provides information about the node such as name, {@link ObjectType type } and other
 * useful properties to construct the virtual filesytem.
 *
 * To access the children of the node, you must first expand it with **`filesystem/expand`**.
 */
export type FilesystemNode = ObjectNode | SystemNode | GroupNode | RootNode;

/**
 * Base properties for all filesystem nodes.
 */
interface BaseNode {
	/**
	 * The display name of the node in the filsystem. The source of this
	 * name differs based on the concrete node type.
	 */
	name: string;

	/**
	 * The children of the node, in the case of a package, this could be
	 * other packages or the development objects directly assigned to it.
	 */
	children?: FilesystemNode[];
}

/**
 * A node representing a repository object, e.g. a package or a class.
 */
export interface ObjectNode extends BaseNode {
	kind: typeof NodeType.Object;

	/**
	 * The type of repository object such as `Package` or `Class`..
	 *
	 * Determines whether it can be expanded, how it will be displayed and opened.
	 */
	object: RepositoryObject;
}

/**
 * A node representing a virtual grouping of related nodes, this abstraction only
 * exists in the filesystem and not in any true organizational means on the system.
 */
export interface GroupNode extends BaseNode {
	kind: typeof NodeType.Group;

	name: VirtualGrouping;
}

/**
 * A node representing the root of the filesystem.
 */
export interface SystemNode extends BaseNode {
	kind: typeof NodeType.System;

	children: [GroupNode, GroupNode, GroupNode];
}

/**
 * A node representing the root of the filesystem.
 */
export interface RootNode extends BaseNode {
	kind: typeof NodeType.Root;

	children?: SystemNode[];
}

/**
 * Constructs a new root filesystem node for the given system name.
 *
 * @param system The name of the system to start a filesystem tree for.
 *
 * @returns A root node with the name of the system and the required groupings.
 */
export function newSystemRoot(system: string): SystemNode {
	return {
		name: system,
		kind: NodeType.System,
		children: [
			{ name: VirtualGrouping.Local, kind: NodeType.Group },
			{ name: VirtualGrouping.Favorites, kind: NodeType.Group },
			{ name: VirtualGrouping.System, kind: NodeType.Group },
		],
	};
}

export function newRootNode(): RootNode {
	return {
		name: '', // root node has no visible name
		kind: NodeType.Root,
		children: [],
	};
}

/**
 * @returns Whether the given node is the {@link RootNode}.
 */
export function isRoot(node: FilesystemNode): node is RootNode {
	return node.kind === NodeType.Root;
}

/**
 * @returns Whether the given node is the {@link RootNode}.
 */
export function isSystem(node: FilesystemNode): node is SystemNode {
	return node.kind === NodeType.System;
}

/**
 * @returns Whether the given node is a {@link GroupNode}.
 */
export function isGroup(node: FilesystemNode): node is GroupNode {
	return node.kind === NodeType.Group;
}

/**
 * @returns Whether the given node is an {@link ObjectNode}.
 */
export function isObject(node: FilesystemNode): node is ObjectNode {
	return node.kind === NodeType.Object;
}

export function walk(
	node: FilesystemNode,
	path: string[],
): FilesystemNode | undefined {
	let curr: FilesystemNode | undefined = node;
	for (const segment of path) {
		if (!curr) {
			break;
		}
		curr = curr?.children?.find((node) => node.name === segment);
	}
	return curr;
}

export function isExpandable(node: FilesystemNode) {
	return isPackage(node) || isGroup(node) || isSystem(node);
}

/**
 * @returns Whether the given node is a {@link RepositoryObject.Package package}.
 */
export function isPackage(
	node: FilesystemNode,
): node is ObjectNode & { object: typeof RepositoryObject.Package } {
	return (
		node.kind === NodeType.Object && node.object === RepositoryObject.Package
	);
}

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
export type FilesystemNode = ObjectNode | RootNode | GroupNode;

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
	children: FilesystemNode[];
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
export interface RootNode extends BaseNode {
	kind: typeof NodeType.Root;

	children: [GroupNode, GroupNode, GroupNode];
}

/**
 * Constructs a new root filesystem node for the given system name.
 *
 * @param system The name of the system to start a filesystem tree for.
 *
 * @returns A root node with the name of the system and the required groupings.
 */
export function newRoot(system: string): RootNode {
	return {
		name: system,
		kind: NodeType.Root,
		children: [
			{ name: VirtualGrouping.Local, children: [], kind: NodeType.Group },
			{ name: VirtualGrouping.Favorites, children: [], kind: NodeType.Group },
			{ name: VirtualGrouping.System, children: [], kind: NodeType.Group },
		],
	};
}

/**
 * @returns Whether the given node is the {@link RootNode}.
 */
export function isRoot(node: FilesystemNode): node is RootNode {
	return node.kind === NodeType.Root;
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

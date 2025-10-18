import {
	Disposable,
	EventEmitter,
	FileSystemError,
	FileType,
	Uri,
	type FileChangeEvent,
	type FileStat,
	type FileSystemProvider,
} from 'vscode';
import {
	walk,
	isExpandable,
	type FilesystemNode,
	toDisplayName,
	toRealName,
	isObject,
	isSystem,
	newSystemRoot,
	type GroupNode,
} from 'core';
import type { ConnectionManager } from 'lib/connection';
import { getTargetSystem } from 'lib';

export class VirtualFilesystem implements FileSystemProvider {
	private roots: Map<string, GroupNode>;

	private _onDidChangeFile = new EventEmitter<FileChangeEvent[]>();
	public readonly onDidChangeFile = this._onDidChangeFile.event;

	constructor(private connections: ConnectionManager) {
		connections.onDidChangeConnection(() => {
			//todo: Refresh the filesystem somehow???
			// do we even need this event here? the workspace now determines
			// what folders are shown,
		});
		this.roots = new Map();
		for (const conn of connections.getWorkspaceConnections()) {
			this.roots.set(conn.systemId, newSystemRoot(conn.systemId));
		}
	}

	/**
	 * Provisions metadata about the requested file. This also controls how the
	 * filesystem is queried later down the line. For example, if the returned
	 * file type of a uri is a directory, {@link readDirectory} will be called on it.
	 *
	 * @param uri The vscode file/folder Uri
	 *
	 * @returns Metadata about the requested file, see {@link toFileStat}.
	 */

	stat(uri: Uri): FileStat {
		const node = this.lookup(uri);
		if (node) {
			return this.toFileStat(node);
		}
		throw FileSystemError.FileNotFound(uri);
	}

	public lookup(uri: Uri): FilesystemNode | undefined {
		const root = this.roots.get(uri.authority.toUpperCase());
		if (root) {
			return walk(root, this.breakIntoParts(uri));
		}
	}

	/**
	 * Expands the directory structure at the given uri, how exactly the nodes
	 * are expanded is dependent on the concrete type of node.
	 *
	 * While the method only returns a mapping of the names to the file types,
	 * the nodes are also added onto the internal tree representation and will
	 * be available instantly in the next scan.
	 *
	 * @param uri The vscode file/folder URI
	 *
	 * @returns A list of tuples mapping the sub-objects to their filetype.
	 */
	async readDirectory(uri: Uri): Promise<[string, FileType][]> {
		const root = this.roots.get(uri.authority.toUpperCase());
		if (!root) {
			throw FileSystemError.FileNotFound(uri);
		}
		const node = walk(root, this.breakIntoParts(uri));
		if (!node || isObject(node)) {
			throw FileSystemError.FileNotFound(uri);
		}

		if (this.isInaccessibleSystem(node)) {
			return [];
		}

		// Expand only for undefined children, empty means it has been expanded.
		if (!node.children) {
			node.children = await this.expand(node, uri.authority.toUpperCase());
		}

		return node.children.map((node: FilesystemNode): [string, FileType] => [
			toDisplayName(node),
			isExpandable(node) ? FileType.Directory : FileType.File,
		]);
	}

	/**
	 * Transforms a {@link FilesystemNode} to the {@link FileStat} vscode expects.
	 *
	 * @param node The node to transform the metadata of.
	 *
	 * @returns The metadata of the file vscode can use to explore the tree.
	 */
	private toFileStat(node: FilesystemNode): FileStat {
		// Do we need ctime, mtime and size? Not really sure where to get it from!
		return {
			type: isExpandable(node) ? FileType.Directory : FileType.File,
			ctime: 0,
			mtime: 0,
			size: 0,
		};
	}

	/**
	 * Breaks a URI into parts including the authority.
	 *
	 * @param uri The vscode URI to break into individual paths.
	 * @returns The individual segments of the path broken down (sequentally).
	 *
	 * ### Example:
	 * ```typescript
	 * <<< "adt://a4h/System Library/Z_PACKAGE/CL_CRAZY_CLASS"
	 * >>> ["A4H", "System Library", "Z_PACKAGE", "CL_CRAZY_CLASS"]
	 */
	private breakIntoParts(uri: Uri): string[] {
		// Make sure to split the path BEFORE replacing the fake slashes!!
		return uri.path
			.split('/')
			.filter((segment) => segment.length > 0)
			.map(toRealName);
	}

	private async expand(
		node: FilesystemNode,
		system: string,
	): Promise<FilesystemNode[]> {
		let client = this.connections.getActive(system)!.getLanguageClient();

		let result = await client.invokeCustom('filesystem/expand', {
			id: node.id,
		});

		// The only concept the server knows is actual repository objects
		return result.children;
	}

	private isInaccessibleSystem(node: FilesystemNode): boolean {
		return isSystem(node) && !this.connections.getActive(node.name);
	}

	public async readFile(uri: Uri): Promise<Uint8Array> {
		const system = getTargetSystem(uri);
		const node = this.lookup(uri);
		if (!node || !system) {
			throw FileSystemError.FileNotFound(uri);
		}
		if (!isObject(node)) {
			throw FileSystemError.FileIsADirectory(uri);
		}

		let client = this.connections.getActive(system)!.getLanguageClient();
		let result = await client.invokeCustom('filesystem/source', {
			id: node.id,
		});

		return new TextEncoder().encode(result.content);
	}

	writeFile(
		uri: Uri,
		content: Uint8Array,
		options: { create: boolean; overwrite: boolean },
	): void {
		throw FileSystemError.FileNotFound();
	}

	rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean }): void {
		throw FileSystemError.FileNotFound();
	}

	delete(uri: Uri): void {
		throw FileSystemError.FileNotFound();
	}

	createDirectory(uri: Uri): void {
		throw FileSystemError.FileNotFound();
	}

	watch(_resource: Uri): Disposable {
		// ignore, fires for all changes...
		return new Disposable(() => {});
	}
}

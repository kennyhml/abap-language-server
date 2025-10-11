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
import type { SystemConnectionProvider } from './connectionProvider';
import {
	newRootNode,
	type RootNode,
	walk,
	isExpandable,
	NodeType,
	type FilesystemNode,
	newSystemRoot,
	isPackage,
	isSystem,
} from '../core/filesystem';

export class VirtualFilesystem implements FileSystemProvider {
	private root: RootNode;

	private _onDidChangeFile = new EventEmitter<FileChangeEvent[]>();
	public readonly onDidChangeFile = this._onDidChangeFile.event;

	constructor(private connectionProvider: SystemConnectionProvider) {
		connectionProvider.onDidChangeSystems(() => {
			//todo: Refresh the filesystem somehow???
			// do we even need this event here? the workspace now determines
			// what folders are shown,
		});

		// Should we just load from the connection provider here? probably?
		this.root = newRootNode();
		this.root.children = connectionProvider.connections.map((conn) =>
			newSystemRoot(conn.systemId),
		);
	}

	stat(uri: Uri): FileStat {
		let node = walk(this.root, this.breakIntoParts(uri));
		if (node) {
			return this.toFileStat(node);
		}
		throw FileSystemError.FileNotFound(uri);
	}

	async readDirectory(uri: Uri): Promise<[string, FileType][]> {
		const node = walk(this.root, this.breakIntoParts(uri));
		if (!node) {
			throw FileSystemError.FileNotFound(uri);
		}

		// For a system node, first check that the system is actually connected to.
		if (isSystem(node)) {
			let system = uri.authority.toUpperCase();
			let client = this.connectionProvider.getConnectionClient(system)!;
			if (client === undefined) {
				return [];
			}
		}

		// Undefined, not empty! Means they have not been fetched yet.
		if (node.children === undefined) {
			let system = uri.authority.toUpperCase();
			let client = this.connectionProvider.getConnectionClient(system)!;

			let response: any;
			if (isPackage(node)) {
				response = await client
					.getLanguageClient()
					.sendRequest('filesystem/expand', {
						package: node.name,
					});
			} else {
				response = await client
					.getLanguageClient()
					.sendRequest('filesystem/expand', {});
			}
			node.children = response.nodes.map(
				(n: any): FilesystemNode => ({
					kind: NodeType.Object,
					name: n.name.replaceAll('/', ' ⁄ '),
					object: n.kind,
				}),
			) as FilesystemNode[];
		}

		return node.children.map((node: FilesystemNode): [string, FileType] => [
			node.name,
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
		if (!uri.authority) {
			return [];
		}
		const pathSegments = uri.path
			.split('/')
			.filter((segment) => segment.length > 0);
		return [uri.authority.toUpperCase(), ...pathSegments];
	}

	readFile(uri: Uri): Uint8Array {
		throw FileSystemError.FileNotFound();
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

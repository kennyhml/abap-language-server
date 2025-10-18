import type { ConnectionManager } from 'lib/connection';
import { ADT_URI_SCHEME, getConnectionUri, getTargetSystem } from 'lib/uri';
import {
	Uri,
	FileDecoration,
	EventEmitter,
	type FileDecorationProvider,
	type Event,
	type CancellationToken,
	type ProviderResult,
	ThemeColor,
} from 'vscode';
import type { VirtualFilesystem } from './filesystem';
import { isFacet } from 'core';

/**
 * Parameters to fire an Event with when the file decoration changed.
 */
type FileDecorationChanged = Uri | Uri[] | undefined;

/**
 * Plugs into the file explorer and is essentially what allows us to modify
 * how the individual system connects are displayed based on their connection state.
 *
 * For example, if there is a system we are not connected to, we can give it an inactive
 * look and display a lock as a badge next to it to indicate that no connection exists.
 *
 * This also means its important that this component gets notified when the connection status
 * of a system changes, so it must integrate with the connection pool to handle events
 * accordingly and also inform the extension framework that such an update occurred.
 */
export class SystemDecorationProvider implements FileDecorationProvider {
	constructor(
		private connections: ConnectionManager,
		private filesystem: VirtualFilesystem,
	) {
		// When a system is connected to, we need to remove the 'locked' decoration
		// from it and propagate the event up to the file decoration change event.
		connections.onDidChangeConnection((event) => {
			const uri = getConnectionUri(event.connection);
			this._onDidChangeFileDecorations.fire(uri);
		});
	}

	/**
	 * Called by vscode when it wants to query the decoration for a certain file.
	 *
	 * @param uri The uri of the file, we really only care about the authority (system)
	 * @param _token A cancellation token, unused because we dont do any long processing.
	 *
	 * @returns A {@link FileDecoration} to tell vscode how to display the filesystem entry.
	 */
	provideFileDecoration(
		uri: Uri,
		_token: CancellationToken,
	): ProviderResult<FileDecoration> {
		if (!uri.authority || !uri.path) {
			return;
		}

		// System Level
		if (uri.path == '/') {
			const system = getTargetSystem(uri);
			if (!this.isExistingSystem(system)) {
				return {
					badge: '⚠️',
					color: new ThemeColor('errorForeground'),
					propagate: false,
					tooltip: `Dangling System: No connection data for '${system}' exists.`,
				};
			}
			if (!this.isActiveSystem(system)) {
				return {
					badge: '🔒',
					color: new ThemeColor('descriptionForeground'),
					propagate: false,
					tooltip: `Not connected to system ${system}.`,
				};
			}
			return undefined;
		}

		// Node Level
		let node = this.filesystem.lookup(uri);
		if (node && isFacet(node) && node.count == 0) {
			return {
				badge: '',
				color: new ThemeColor('descriptionForeground'),
				propagate: false,
				tooltip: `No elements`,
			};
		}
	}

	/**
	 * Checks whether the filesystem uri points to a system that exists.
	 *
	 * For example, the workspace might still have a system added that was already
	 * removed from the global connection pool, thus its essentially a dangling
	 * system that we cant connect to because no data to connect with exists.
	 *
	 * @param name The name of the system, extracted from the authority of the `Uri`
	 *
	 * @returns Whether the entry pointed to by the uri is a valid system to connect to.
	 */
	private isExistingSystem(name: string): boolean {
		return !!this.connections.getData(name);
	}

	/**
	 * Checks whether the filesystem uri points to an system that is currently connected to.
	 *
	 * @param name The name of the system, extracted from the authority of the `Uri`
	 *
	 * @returns Whether the entry pointed to by the uri is a system with an active connection.
	 */
	private isActiveSystem(name: string): boolean {
		return !!this.connections.getActive(name);
	}

	private readonly _onDidChangeFileDecorations =
		new EventEmitter<FileDecorationChanged>();

	readonly onDidChangeFileDecorations: Event<FileDecorationChanged> =
		this._onDidChangeFileDecorations.event;
}

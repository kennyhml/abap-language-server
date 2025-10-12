import type { ConnectionManager } from 'lib/connection';
import { getConnectionUri, getTargetSystem } from 'lib/uri';
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
	constructor(private connections: ConnectionManager) {
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
		// We only want to apply decoration when its a system we are not connected to.
		// For any other case, its okay to just keep the default decoration.
		if (this.isUnknownOrConnected(uri)) {
			return;
		}
		return {
			badge: '🔒',
			color: new ThemeColor('descriptionForeground'),
			propagate: false,
			tooltip: `Not connected to system ${uri.authority.toUpperCase()}`,
		};
	}

	/**
	 * Checks whether the filesystem uri points to an entry not related to our
	 * extension or to a system that is already connected to.
	 *
	 * @param uri The `Uri` supplied by vscode to get the decoration for
	 *
	 * @returns Whether the entry pointed to by the uri is unknown or an active system.
	 */
	private isUnknownOrConnected(uri: Uri): boolean {
		let system = getTargetSystem(uri);
		return (
			!this.connections.getData(system) || !!this.connections.getActive(system)
		);
	}

	private readonly _onDidChangeFileDecorations =
		new EventEmitter<FileDecorationChanged>();

	readonly onDidChangeFileDecorations: Event<FileDecorationChanged> =
		this._onDidChangeFileDecorations.event;
}

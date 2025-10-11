import * as vscode from 'vscode';
import { AddConnectionPanel } from './panels/addConnection';
import { SystemConnectionProvider } from 'adapters/connectionProvider';
import { ConnectionTreeProvider } from 'views/connectionTree';
import { ConnectionState, type SystemConnection } from 'core';
import { EditConnectionPanel } from 'panels/editConnection';
import { VirtualFilesystem } from 'adapters/filesystemProvider';

class DecorationProviderTest implements vscode.FileDecorationProvider {
	private readonly _onDidChangeFileDecorations = new vscode.EventEmitter<
		vscode.Uri | vscode.Uri[] | undefined
	>();
	readonly onDidChangeFileDecorations: vscode.Event<
		vscode.Uri | vscode.Uri[] | undefined
	> = this._onDidChangeFileDecorations.event;

	constructor(private connectionProvider: SystemConnectionProvider) {
		this.connectionProvider.onDidChangeSystems(() => {
			const uri = vscode.Uri.parse('adt://a4h');
			this._onDidChangeFileDecorations.fire(uri);
		});
	}

	provideFileDecoration(
		uri: vscode.Uri,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.FileDecoration> {
		if (!(uri.authority === 'a4h' && uri.path === '/')) {
			return;
		}

		// Dont apply if connected
		if (
			this.connectionProvider.getConnection(uri.authority.toUpperCase())
				?.state === ConnectionState.connected
		) {
			return;
		}

		return {
			badge: '🔒',
			color: new vscode.ThemeColor('descriptionForeground'),
			propagate: false,
			tooltip: `Not connected to system ${uri.authority.toUpperCase()}`,
		};
	}
}

export async function activate(context: vscode.ExtensionContext) {
	let systemProvider = new SystemConnectionProvider(context.workspaceState);

	const vfs = new VirtualFilesystem(systemProvider);
	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider('adt', vfs, {
			isCaseSensitive: true,
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('abap.openAddConnectionScreen', () => {
			AddConnectionPanel.render(context, systemProvider);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'abap.editSystemConnection',
			(conn: SystemConnection) => {
				EditConnectionPanel.render(context, conn, systemProvider);
			},
		),
	);

	vscode.window.registerFileDecorationProvider(
		new DecorationProviderTest(systemProvider),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'abap.connectToSystem',
			async (conn: SystemConnection) => {
				const workspaceUri = vscode.Uri.parse(`adt://${conn.systemId}`);
				const workspaceFolders = vscode.workspace.workspaceFolders || [];
				if (!workspaceFolders.some((folder) => folder.name === conn.systemId)) {
					vscode.window.showWarningMessage(
						`Adding ${conn.systemId} to workspace, extension might reload.`,
					);
					vscode.workspace.updateWorkspaceFolders(workspaceFolders.length, 0, {
						uri: workspaceUri,
						name: conn.systemId,
					});
				}
				vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: `Connecting to ${conn.systemId}...`,
						cancellable: false,
					},
					async (progress, token) => {
						await systemProvider.createConnectionClient(conn);
						progress.report({ increment: 100, message: '' });
					},
				);
			},
		),
	);

	vscode.window.registerTreeDataProvider(
		'systems',
		new ConnectionTreeProvider(context, systemProvider),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'abap.deleteSystemConnection',
			(system: SystemConnection) => {
				systemProvider.deleteConnection(system.name);
			},
		),
	);

	console.log('Extension activated.');
}

export function deactivate() {
	console.log('Deactivate.');
}

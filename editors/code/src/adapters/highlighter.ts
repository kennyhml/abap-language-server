import { getTargetSystem, type Connection, type ConnectionManager } from 'lib';
import { EventEmitter, type DocumentSemanticTokensProvider } from 'vscode';
import * as vscode from 'vscode';

const tokenTypes = ['variable', 'keyword', 'number', 'string', 'type'];
const tokenModifiers = [];

export const legend = new vscode.SemanticTokensLegend(
	tokenTypes,
	tokenModifiers,
);

export class SemanticHighlighter implements DocumentSemanticTokensProvider {
	constructor(private connections: ConnectionManager) {}

	async provideDocumentSemanticTokens(
		document: vscode.TextDocument,
	): Promise<vscode.SemanticTokens | undefined> {
		let system = getTargetSystem(document.uri);
		let client = this.connections.getActive(system)?.getLanguageClient();
		if (!client) {
			return;
		}

		let result: vscode.SemanticTokens = await client.sendRequest(
			'textDocument/semanticTokens/full',
			{
				textDocument: { uri: document.uri.toString() },
			},
		);
		return result;
	}

	provideDocumentSemanticTokensEdits(document, previousResultId, token) {
		const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
		// on line 1, characters 1-5 are a class declaration
		tokensBuilder.push(
			new vscode.Range(new vscode.Position(1, 1), new vscode.Position(1, 5)),
			'class',
			['declaration'],
		);
		return tokensBuilder.build();
	}

	private _onDidChangeSemanticTokens = new EventEmitter<void>();
	public readonly onDidChangeSemanticTokens =
		this._onDidChangeSemanticTokens?.event;
}

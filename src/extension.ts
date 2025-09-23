import * as vscode from 'vscode';
import { MemFS } from './filesystem';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "abap" is now active!');

	const memFs = new MemFS();
	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider('memfs', memFs, {
			isCaseSensitive: true,
		}),
	);

	memFs.createDirectory(vscode.Uri.parse('memfs:/A4H'));
	memFs.createDirectory(vscode.Uri.parse('memfs:/W4D'));

	vscode.workspace.updateWorkspaceFolders(0, 0, {
		uri: vscode.Uri.parse('memfs:/A4H'),
		name: 'A4H',
	});
	vscode.workspace.updateWorkspaceFolders(1, 0, {
		uri: vscode.Uri.parse('memfs:/W4D'),
		name: 'W4D',
	});

	memFs.writeFile(vscode.Uri.parse('memfs:/W4D/gay.py'), randomData(20), {
		create: true,
		overwrite: true,
	});
}

export function deactivate() {}

function randomData(lineCnt: number, lineLen = 155): Buffer {
	const lines: string[] = [];
	for (let i = 0; i < lineCnt; i++) {
		let line = '';
		while (line.length < lineLen) {
			line += Math.random()
				.toString(2 + (i % 34))
				.substr(2);
		}
		lines.push(line.substr(0, lineLen));
	}
	return Buffer.from(lines.join('\n'), 'utf8');
}

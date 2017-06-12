import * as fs from 'fs';
import * as path from 'path';
import {
	workspace,
	window
} from 'vscode';

/**
 * Generate a .editorconfig file in the root of the workspace based on the
 * current vscode settings.
 */
export function generateEditorConfig() {
	if (!workspace.rootPath) {
		window.showInformationMessage(
			'Please open a folder before generating an .editorconfig file'
		);
		return;
	}

	const editorConfigFile = path.join(workspace.rootPath, '.editorconfig');

	fs.stat(editorConfigFile, (err, stats) => {

		if (err) {
			if (err.code === 'ENOENT') {
				writeFile();
			} else {
				window.showErrorMessage(err.message);
			}
			return;
		}

		if (stats.isFile()) {
			window.showErrorMessage(
				'A .editorconfig file already exists in your workspace.'
			);
		}
	});

	function writeFile() {
		const editor = workspace.getConfiguration('editor');
		const files = workspace.getConfiguration('files');

		const settingsLines = ['root = true', '', '[*]'];
		function addSetting(key: string, value?: string | number | boolean): void {
			if (value !== undefined) {
				settingsLines.push(`${key} = ${value}`);
			}
		}

		const insertSpaces = editor.get<boolean>('insertSpaces');

		addSetting('indent_style',
			insertSpaces ? 'space' : 'tab');

		addSetting(insertSpaces ? 'indent_size' : 'tab_size',
			editor.get<number>('tabSize'));

		const eolMap = {
			'\r\n': 'crlf',
			'\n': 'lf',
		};
		addSetting('end_of_line', eolMap[files.get<string>('eol')]);

		const encodingMap = {
			'iso88591': 'latin1',
			'utf8': 'utf-8',
			'utf8bom': 'utf-8-bom',
			'utf16be': 'utf-16-be',
			'utf16le': 'utf-16-le',
		};
		addSetting('charset', encodingMap[files.get<string>('encoding')]);

		addSetting('trim_trailing_whitespace',
			files.get<boolean>('trimTrailingWhitespace'));

		addSetting('insert_final_newline',
			files.get<boolean>('insertFinalNewline'));

		fs.writeFile(editorConfigFile, settingsLines.join('\n'), err => {
			if (err) {
				window.showErrorMessage(err.message);
				return;
			}
		});
	}
}

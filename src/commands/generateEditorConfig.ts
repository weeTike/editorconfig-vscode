'use strict';

import * as fs from 'fs';
import * as path from 'path';
import {
	workspace,
	window
} from 'vscode';
import Utils from '../Utils';

const propsToGenerate = ['indent_style', 'indent_size', 'tab_width'];

/**
 * Generate an .editorconfig file in the root of the workspace based on the
 * current vscode settings.
 */
export function generateEditorConfig() {
	if (!workspace.rootPath) {
		window.showInformationMessage(
			'Please open a folder before generating an .editorconfig file'
		);
		return;
	}

	const editorconfigFile = path.join(workspace.rootPath, '.editorconfig');

	fs.exists(editorconfigFile, exists => {
		if (exists) {
			window.showInformationMessage(
				'A .editorconfig file already exists in your workspace.'
			);
			return;
		}

		const editorConfigurationNode = workspace.getConfiguration('editor');
		const settings = Utils.toEditorConfig({
			insertSpaces: editorConfigurationNode
				.get<string | boolean>('insertSpaces'),
			tabSize: editorConfigurationNode
				.get<string | number>('tabSize')
		});

		let fileContents = ['root = true', '', '[*]'];

		propsToGenerate.forEach(setting => {
			if (settings.hasOwnProperty(setting)) {
				fileContents.push(`${setting} = ${settings[setting]}`);
			}
		});

		fs.writeFile(editorconfigFile, fileContents.join('\n'), err => {
			if (err) {
				window.showErrorMessage(err.toString());
				return;
			}
		});
	});
}

'use strict';

import * as editorconfig from 'editorconfig';
import {
	workspace,
	window,
	TextEditor,
	TextDocument,
	TextLine,
	Position,
	Range
} from 'vscode';

/**
 * Transform the textdocument by trimming the trailing whitespace.
 */
export function transform(
	editorconfig: editorconfig.knownProps,
	editor: TextEditor,
	textDocument: TextDocument
) {
	const editorTrimsWhitespace = workspace
		.getConfiguration('files')
		.get('trimTrailingWhitespace', false);

	if (editorTrimsWhitespace && !editorconfig.trim_trailing_whitespace) {
		window.showWarningMessage([
			'The trimTrailingWhitespace workspace or user setting is',
			'overriding the EditorConfig setting for this file.'
		].join(' '));
		return Promise.resolve([true]);
	}

	if (editorTrimsWhitespace || !editorconfig.trim_trailing_whitespace) {
		return Promise.resolve([true]);
	}

	const trimmingOperations: Thenable<boolean>[] = [];

	for (let i = 0; i < textDocument.lineCount; i++) {
		trimmingOperations.push(
			trimLineTrailingWhitespace(textDocument.lineAt(i))
		);
	}

	return Promise.all<boolean>(trimmingOperations);

	function trimLineTrailingWhitespace(line: TextLine): Thenable<boolean> {
		const trimmedLine = trimTrailingWhitespace(line.text);
		if (trimmedLine === line.text) {
			return Promise.resolve(true);
		}

		return editor.edit(edit => {
			const whitespaceBegin = new Position(
				line.lineNumber,
				trimmedLine.length
			);
			const whitespaceEnd = new Position(
				line.lineNumber,
				line.text.length
			);
			const whitespace = new Range(
				whitespaceBegin,
				whitespaceEnd
			);
			edit.delete(whitespace);
		});
	}
}

function trimTrailingWhitespace(input: string) {
	return input.replace(/[\s\uFEFF\xA0]+$/g, '');
}

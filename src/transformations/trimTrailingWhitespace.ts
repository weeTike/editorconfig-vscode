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
): Thenable<void | string | Thenable<boolean>[]> {
	const editorTrimsWhitespace = workspace
		.getConfiguration('files')
		.get('trimTrailingWhitespace', false);

	if (editorTrimsWhitespace && !editorconfig.trim_trailing_whitespace) {
		return window.showWarningMessage([
			'The `trimTrailingWhitespace` workspace setting is',
			'overriding the EditorConfig setting for this file.'
		].join(' '));
	}

	if (editorTrimsWhitespace || !editorconfig.trim_trailing_whitespace) {
		return Promise.resolve();
	}

	const trimmingOperations: Thenable<boolean>[] = [];

	for (let i = 0; i < textDocument.lineCount; i++) {
		trimmingOperations.push(
			trimLineTrailingWhitespace(textDocument.lineAt(i))
		);
	}

	return Promise.all(trimmingOperations);

	function trimLineTrailingWhitespace(line: TextLine): Thenable<boolean> {
		const trimmedLine = trimTrailingWhitespace(line.text);
		if (trimmedLine === line.text) {
			return;
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

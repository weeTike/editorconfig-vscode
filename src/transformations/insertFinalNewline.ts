import * as editorconfig from 'editorconfig';
import {
	TextEditor,
	TextDocument,
	Position
} from 'vscode';

const lineEndings = {
	cr: '\r',
	crlf: '\r\n'
};

/**
 * Transform the textdocument by inserting a final newline.
 */
export function transform(
	editorconfig: editorconfig.knownProps,
	editor: TextEditor,
	textDocument: TextDocument
): Thenable<boolean|void> {
	const lineCount = textDocument.lineCount;

	if (!editorconfig.insert_final_newline || lineCount === 0) {
		return Promise.resolve();
	}

	const lastLine = textDocument.lineAt(lineCount - 1);
	const lastLineLength = lastLine.text.length;

	if (lastLineLength === 0) {
		return Promise.resolve();
	}

	return editor.edit(edit => {
		const pos = new Position(lastLine.lineNumber, lastLineLength);
		return edit.insert(pos, newline(editorconfig));
	});
}

function newline(editorconfig: editorconfig.knownProps) {
	if (!editorconfig.end_of_line) {
		return '\n';
	}

	return lineEndings[editorconfig.end_of_line.toLowerCase()] || '\n';
}

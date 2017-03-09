import * as editorconfig from 'editorconfig';
import { EndOfLine, TextDocument } from 'vscode';

import { findEditor } from '../Utils';

/**
 * Transform the textdocument by setting the end of line sequence
 */
export async function transform(
	editorconfig: editorconfig.knownProps,
	textDocument: TextDocument
) {
	const eol = {
		lf: EndOfLine.LF,
		crlf: EndOfLine.CRLF
	}[(editorconfig.end_of_line || '').toLowerCase()];

	if (!eol) {
		return Promise.resolve(false);
	}

	return findEditor(textDocument).edit(edit => {
		edit.setEndOfLine(eol);
	});
}

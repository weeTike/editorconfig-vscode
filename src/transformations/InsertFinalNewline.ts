import * as get from 'lodash.get';
import * as editorconfig from 'editorconfig';
import {
	TextDocument,
	Position,
	TextEdit
} from 'vscode';

import PreSaveTransformation from './PreSaveTransformation';

export default class InsertFinalNewline extends PreSaveTransformation {

	private lineEndings = {
		CR: '\r',
		CRLF: '\r\n',
		LF: '\n'
	};

	transform(
		editorconfig: editorconfig.knownProps,
		doc: TextDocument
	) {
		const lineCount = doc.lineCount;
		const lastLine = doc.lineAt(lineCount - 1);

		if (!editorconfig.insert_final_newline
			|| lineCount === 0
			|| lastLine.isEmptyOrWhitespace) {
			return { edits: [] };
		}

		const position = new Position(
			lastLine.lineNumber,
			lastLine.text.length
		);

		const eol = get(editorconfig, 'end_of_line', 'lf').toUpperCase();

		return {
			edits: [ TextEdit.insert(position, this.lineEndings[eol]) ],
			message: `insertFinalNewline(${eol})`
		};
	}
}

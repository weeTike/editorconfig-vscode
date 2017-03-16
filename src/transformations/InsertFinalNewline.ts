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
		cr: '\r',
		crlf: '\r\n',
		lf: '\n'
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
			return [];
		}

		const position = new Position(lastLine.lineNumber, lastLine.text.length);

		return [
			TextEdit.insert(position, this.lineEndings[
				get(editorconfig, 'end_of_line', 'lf').toLowerCase()
			])
		];
	}
}

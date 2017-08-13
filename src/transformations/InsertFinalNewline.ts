import * as get from 'lodash.get';
import * as editorconfig from 'editorconfig';
import {
	TextDocument,
	Position,
	Range,
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
		editorconfigProperties: editorconfig.knownProps,
		doc: TextDocument
	) {
		const lineCount = doc.lineCount;
		const lastLine = doc.lineAt(lineCount - 1);

		if (lineCount === 0) {
			return { edits: [] };
		}

		if (editorconfigProperties.insert_final_newline) {
			if (lastLine.isEmptyOrWhitespace) {
				return { edits: [] };
			} else {
				const position = new Position(
					lastLine.lineNumber,
					lastLine.text.length
				);

				const eol = get(editorconfigProperties, 'end_of_line', 'lf').toUpperCase();

				return {
					edits: [ TextEdit.insert(position, this.lineEndings[eol]) ],
					message: `insertFinalNewline(${eol})`
				};
			}
		} else {
			if (lastLine.isEmptyOrWhitespace) {
				let realLastLine = lastLine;
				let realLastLineDetected = false;
				let lineCounter = 1;

				while (!realLastLineDetected) {
					if (!realLastLine.isEmptyOrWhitespace) {
						realLastLineDetected = true;
					} else {
						lineCounter++;
						realLastLine = doc.lineAt(lineCount - lineCounter);
					}
				}

				const rangeStart = realLastLine.range;
				const rangeEnd = lastLine.range;

				const positionStart = rangeStart[Object.keys(rangeStart)[1]];
				const positionEnd = rangeEnd[Object.keys(rangeEnd)[1]];

				const range = new Range(
					positionStart,
					positionEnd
				);

				return {
					edits: [ TextEdit.delete(range) ],
					message: `deleteRange(${range})`
				};
			} else {
				return { edits: [] };
			}
		}
	}
}

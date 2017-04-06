import * as editorconfig from 'editorconfig';
import {
	EndOfLine,
	TextEdit
} from 'vscode';

import PreSaveTransformation from './PreSaveTransformation';

class SetEndOfLine extends PreSaveTransformation {

	private eolMap = {
		lf: EndOfLine.LF,
		crlf: EndOfLine.CRLF
	};

	transform(
		editorconfig: editorconfig.knownProps
	): TextEdit[] {
		const eolKey = (editorconfig.end_of_line || '').toLowerCase();
		const eol = this.eolMap[eolKey];

		return (eol)
			? [ TextEdit.setEndOfLine(eol) ]
			: [];
	}
}

export default SetEndOfLine;

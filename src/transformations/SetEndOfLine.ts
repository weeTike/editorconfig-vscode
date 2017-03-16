import * as editorconfig from 'editorconfig';
import {
	EndOfLine,
	TextEditor
} from 'vscode';

import OnOpenTransformation from './OnOpenTransformation';

class SetEndOfLine extends OnOpenTransformation {

	private eolMap = {
		lf: EndOfLine.LF,
		crlf: EndOfLine.CRLF
	};

	async transform(
		editorconfig: editorconfig.knownProps,
		editor: TextEditor
	) {
		const eolKey = (editorconfig.end_of_line || '').toLowerCase();
		const eol = this.eolMap[eolKey.toLowerCase()];

		if (!eol) {
			return { success: false };
		}

		return {
			applied: { eol: eolKey.toUpperCase() },
			success: await editor.edit(edit => {
				edit.setEndOfLine(eol);
			})
		};
	}
}

export default SetEndOfLine;

import { KnownProps } from 'editorconfig';
import { TextDocument, TextEdit } from 'vscode';

abstract class PreSaveTransformation {
	abstract transform(
		editorconfig: KnownProps,
		doc?: TextDocument
	): {
		edits: TextEdit[] | Error;
		message?: string;
	};
}

export default PreSaveTransformation;

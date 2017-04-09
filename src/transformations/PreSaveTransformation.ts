import * as editorconfig from 'editorconfig';
import { TextDocument, TextEdit } from 'vscode';

abstract class PreSaveTransformation {
	abstract transform(
		editorconfig: editorconfig.knownProps,
		doc?: TextDocument
	): TextEdit[]
}

export default PreSaveTransformation;

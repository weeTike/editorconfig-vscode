import * as editorconfig from 'editorconfig';
import { TextEditor } from 'vscode';

abstract class OnOpenTransformation {
	abstract async transform(
		editorconfig: editorconfig.knownProps,
		editor: TextEditor
	): Promise<{
		// tslint:disable-next-line:no-any
		applied?: { [propName: string]: any };
		success: boolean;
	}>;
}

export default OnOpenTransformation;

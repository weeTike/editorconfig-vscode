import * as editorconfig from 'editorconfig';
import { TextDocument } from 'vscode';

abstract class PreSaveCommand {
	abstract async transform(
		editorconfig: editorconfig.knownProps,
		doc: TextDocument
	): Promise<void>
}

export default PreSaveCommand;

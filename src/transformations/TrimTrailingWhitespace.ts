import * as editorconfig from 'editorconfig';
import {
	commands,
	workspace,
	TextDocument
} from 'vscode';

import PreSaveCommand from './PreSaveCommand';

class TrimTrailingWhitespace extends PreSaveCommand {
	async transform(
		editorconfig: editorconfig.knownProps,
		doc: TextDocument
	) {
		const editorTrimsWhitespace = workspace
			.getConfiguration('files')
			.get('trimTrailingWhitespace', false);

		if (editorTrimsWhitespace) {
			if (editorconfig.trim_trailing_whitespace === false) {
				return Promise.reject(new Error([
					'The trimTrailingWhitespace workspace or user setting is',
					'overriding the EditorConfig setting for this file.'
				].join(' ')));
			}
		}

		if (!editorconfig.trim_trailing_whitespace) {
			return Promise.resolve();
		}

		return await commands.executeCommand(
			'editor.action.trimTrailingWhitespace',
			doc.uri
		);
	}
}

export default TrimTrailingWhitespace;

import { KnownProps } from 'editorconfig'
import { TextDocument, TextEdit, TextDocumentSaveReason } from 'vscode'

abstract class PreSaveTransformation {
	abstract transform(
		editorconfig: KnownProps,
		doc?: TextDocument,
		reason?: TextDocumentSaveReason,
	): {
		edits: TextEdit[] | Error
		message?: string
	}
}

export default PreSaveTransformation

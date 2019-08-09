import { ExtensionContext, DocumentSelector, commands, languages } from 'vscode'
import EditorConfigCompletionProvider from './EditorConfigCompletionProvider'
import DocumentWatcher from './DocumentWatcher'
import { generateEditorConfig } from './commands/generateEditorConfig'
import {
	applyTextEditorOptions,
	fromEditorConfig,
	resolveCoreConfig,
	resolveTextEditorOptions,
	toEditorConfig,
} from './api'

/**
 * Main entry
 */
export function activate(ctx: ExtensionContext) {
	ctx.subscriptions.push(new DocumentWatcher())

	// register .editorconfig file completion provider
	const editorConfigFileSelector: DocumentSelector = {
		language: 'properties',
		pattern: '**/.editorconfig',
		scheme: 'file',
	}
	languages.registerCompletionItemProvider(
		editorConfigFileSelector,
		new EditorConfigCompletionProvider(),
	)

	// register an internal command used to automatically display IntelliSense
	// when editing a .editorconfig file
	commands.registerCommand('editorconfig._triggerSuggestAfterDelay', () => {
		setTimeout(function() {
			commands.executeCommand('editor.action.triggerSuggest')
		}, 100)
	})

	// register a command handler to generate a .editorconfig file
	commands.registerCommand('EditorConfig.generate', generateEditorConfig)

	return {
		applyTextEditorOptions,
		fromEditorConfig,
		resolveCoreConfig,
		resolveTextEditorOptions,
		toEditorConfig,
	}
}

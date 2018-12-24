import * as get from 'lodash.get';
import { KnownProps } from 'editorconfig';
import {
	window,
	TextDocument,
	TextEditor,
	TextEditorOptions
} from 'vscode';

/**
 * Convert .editorconfig values to vscode editor options
 */
export function fromEditorConfig(
	config: KnownProps,
	defaults: TextEditorOptions
): TextEditorOptions {
	const resolved: TextEditorOptions = {
		tabSize: (config.indent_style === 'tab'
			? get(config, 'tab_width', config.indent_size)
			: get(config, 'indent_size', config.tab_width)
		)
	};
	if (get(resolved, 'tabSize') === 'tab') {
		resolved.tabSize = config.tab_width;
	}
	return {
		...(config.indent_style === 'tab'
			|| config.indent_size === 'tab'
			|| config.indent_style === 'space'
		) ? {
			insertSpaces: config.indent_style === 'space'
		} : {},
		tabSize: resolved.tabSize >= 0
			? resolved.tabSize
			: defaults.tabSize
	};
}

/**
 * Convert vscode editor options to .editorconfig values
 */
export function toEditorConfig(options: TextEditorOptions) {
	const result: KnownProps = {};

	switch (options.insertSpaces) {
		case true:
			result.indent_style = 'space';
			result.indent_size = resolveTabSize(options.tabSize);
			break;
		case false:
		case 'auto':
			result.indent_style = 'tab';
			result.tab_width = resolveTabSize(options.tabSize);
			break;
	}

	return result;
}

/**
 * Convert vscode tabSize option into numeric value
 */
export function resolveTabSize(tabSize: number|string) {
	return (tabSize === 'auto') ? 4 : parseInt(String(tabSize), 10);
}

/**
 * Retrieve the current active text editor.
 */
export function findEditor(doc: TextDocument): TextEditor {
	for (const editor of window.visibleTextEditors) {
		if (editor.document === doc) {
			return editor;
		}
	}

	return null;
}

import * as editorconfig from 'editorconfig';
import * as path from 'path';
import {
	window,
	workspace,
	Disposable,
	TextDocument,
	TextEditor,
	TextEditorOptions,
	TextEdit
} from 'vscode';
import * as Utils from './Utils';
import {
	endOfLineTransform,
	trimTrailingWhitespaceTransform,
	insertFinalNewlineTransform
} from './transformations';
import {
	EditorConfigProvider
} from './interfaces/editorConfigProvider';

/**
 * Listens to vscode document open and maintains a map
 * (Document => editor config settings)
 */
class DocumentWatcher implements EditorConfigProvider {

	private _documentToConfigMap: { [uri: string]: editorconfig.knownProps };
	private _disposable: Disposable;
	private _defaults: TextEditorOptions;

	constructor() {
		const subscriptions: Disposable[] = [];

		// Listen for changes in the active text editor
		subscriptions.push(window.onDidChangeActiveTextEditor(textEditor => {
			if (textEditor && textEditor.document) {
				this._onDidOpenDocument(textEditor.document);
			}
		}));

		// Listen for changes in the configuration
		subscriptions.push(workspace.onDidChangeConfiguration(
			this._onConfigChanged.bind(this)
		));

		// Listen for saves to ".editorconfig" files and rebuild the map
		subscriptions.push(workspace.onDidSaveTextDocument(
			async savedDocument => {
				if (path.basename(savedDocument.fileName) === '.editorconfig') {
					await this._rebuildConfigMap();
				}
			}
		));

		subscriptions.push(workspace.onWillSaveTextDocument(e => {
			e.waitUntil(calculatePreSaveTransformations.call(this, e.document));
		}));

		// dispose event subscriptons upon disposal
		this._disposable = Disposable.from.apply(this, subscriptions);

		// Build the map (cover the case that documents were opened before
		// my activation)
		this._rebuildConfigMap();

		// Load the initial workspace configuration
		this._onConfigChanged();
	}

	public dispose() {
		this._disposable.dispose();
	}

	public getSettingsForDocument(document: TextDocument) {
		return this._documentToConfigMap[document.fileName];
	}

	public getDefaultSettings() {
		return this._defaults;
	}

	private _rebuildConfigMap() {
		this._documentToConfigMap = {};
		return Promise.all(workspace.textDocuments.map(
			document => this._onDidOpenDocument(document)
		));
	}

	private _onDidOpenDocument(document: TextDocument) {
		if (document.isUntitled) {
			// Does not have a fs path
			return Promise.resolve();
		}
		const path = document.fileName;

		if (this._documentToConfigMap[path]) {
			applyEditorConfigToTextEditor.call(this, window.activeTextEditor);
			return Promise.resolve();
		}

		return editorconfig.parse(path)
			.then((config: editorconfig.knownProps) => {
				if (config.indent_size === 'tab') {
					config.indent_size = config.tab_width;
				}

				this._documentToConfigMap[path] = config;

				applyEditorConfigToTextEditor.call(this, window.activeTextEditor);
			});
	}

	private _onConfigChanged() {
		const workspaceConfig = workspace.getConfiguration('editor');
		const detectIndentation = workspaceConfig.get<boolean>('detectIndentation');

		this._defaults = (detectIndentation) ? {} : {
			tabSize: workspaceConfig.get<string | number>('tabSize'),
			insertSpaces: workspaceConfig.get<string | boolean>('insertSpaces')
		};
	}
}

async function calculatePreSaveTransformations(
	this: EditorConfigProvider,
	textDocument: TextDocument
): Promise<TextEdit[] | void> {
	const editorconfig = this.getSettingsForDocument(textDocument);

	if (!editorconfig) {
		// no configuration found for this file
		return Promise.resolve();
	}

	await endOfLineTransform(editorconfig, textDocument);

	return [
		...insertFinalNewlineTransform(editorconfig, textDocument),
		...trimTrailingWhitespaceTransform(editorconfig, textDocument)
	];
}

function applyEditorConfigToTextEditor(
	this: EditorConfigProvider,
	textEditor: TextEditor
) {
	if (!textEditor) {
		// No more open editors
		return;
	}

	const doc = textEditor.document;
	const editorconfig = this.getSettingsForDocument(doc);

	if (!editorconfig) {
		// no configuration found for this file
		return;
	}

	const newOptions = Utils.fromEditorConfig(
		editorconfig,
		this.getDefaultSettings()
	);

	/* tslint:disable:no-any */
	textEditor.options = newOptions as any;
	/* tslint:enable */
}

export default DocumentWatcher;

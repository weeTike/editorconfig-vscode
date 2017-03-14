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
import { fromEditorConfig } from './Utils';
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

	private docToConfigMap: { [fileName: string]: editorconfig.knownProps };
	private disposable: Disposable;
	private defaults: TextEditorOptions;

	constructor() {
		const subscriptions: Disposable[] = [];

		// Listen for changes in the active text editor
		subscriptions.push(window.onDidChangeActiveTextEditor(editor => {
			if (editor && editor.document) {
				this.onDidOpenDocument(editor.document);
			}
		}));

		// Listen for changes in the configuration
		subscriptions.push(workspace.onDidChangeConfiguration(
			this.onConfigChanged.bind(this)
		));

		// Listen for saves to ".editorconfig" files and rebuild the map
		subscriptions.push(workspace.onDidSaveTextDocument(savedDocument => {
			if (path.basename(savedDocument.fileName) === '.editorconfig') {
				// Saved an .editorconfig file => rebuild map entirely and then
				// apply the changes to the .editorconfig file itself
				this.rebuildConfigMap();
				// TODO The transformations should be applied to the .editorconfig`
				// file as well after the config has been rebuilt
				// this._rebuildConfigMap().then(applyOnSaveTransformations.bind(
				// 	undefined,
				// 	savedDocument,
				// 	this
				// ));
				return;
			}
		}));

		subscriptions.push(workspace.onWillSaveTextDocument(e => {
			const edits = this.calculatePreSaveTransformations(e.document);

			e.waitUntil(Promise.resolve(edits));
		}));

		// dispose event subscriptons upon disposal
		this.disposable = Disposable.from.apply(this, subscriptions);

		// Build the map (cover the case that documents were opened before
		// my activation)
		this.rebuildConfigMap();

		// Load the initial workspace configuration
		this.onConfigChanged();
	}

	public dispose() {
		this.disposable.dispose();
	}

	public getSettingsForDocument(doc: TextDocument) {
		return this.docToConfigMap[doc.fileName];
	}

	public getDefaultSettings() {
		return this.defaults;
	}

	private rebuildConfigMap() {
		this.docToConfigMap = {};
		return Promise.all(workspace.textDocuments.map(
			doc => this.onDidOpenDocument(doc)
		));
	}

	private onDidOpenDocument(doc: TextDocument) {
		if (doc.isUntitled) {
			// Does not have a fs path
			return Promise.resolve();
		}
		const path = doc.fileName;

		if (this.docToConfigMap[path]) {
			this.applyEditorConfigToTextEditor(window.activeTextEditor);
			return Promise.resolve();
		}

		return editorconfig.parse(path)
			.then((config: editorconfig.knownProps) => {
				if (config.indent_size === 'tab') {
					config.indent_size = config.tab_width;
				}

				this.docToConfigMap[path] = config;

				return this.applyEditorConfigToTextEditor(window.activeTextEditor);
			});
	}

	private applyEditorConfigToTextEditor(
		editor: TextEditor
	) {
		if (!editor) {
			// No more open editors
			return Promise.resolve();
		}

		const doc = editor.document;
		const editorconfig = this.getSettingsForDocument(doc);

		if (!editorconfig) {
			// no configuration found for this file
			return Promise.resolve();
		}

		const newOptions = fromEditorConfig(
			editorconfig,
			this.getDefaultSettings()
		);

		/* tslint:disable:no-any */
		editor.options = newOptions as any;
		/* tslint:enable */

		return endOfLineTransform(editorconfig, editor);
	}

	private onConfigChanged() {
		const workspaceConfig = workspace.getConfiguration('editor');
		const detectIndentation = workspaceConfig.get<boolean>('detectIndentation');

		this.defaults = (detectIndentation) ? {} : {
			tabSize: workspaceConfig.get<string | number>('tabSize'),
			insertSpaces: workspaceConfig.get<string | boolean>('insertSpaces')
		};
	}

	private calculatePreSaveTransformations(
		doc: TextDocument
	): TextEdit[] | void {
		const editorconfig = this.getSettingsForDocument(doc);

		if (!editorconfig) {
			// no configuration found for this file
			return;
		}

		return [
			...insertFinalNewlineTransform(editorconfig, doc),
			...trimTrailingWhitespaceTransform(editorconfig, doc)
		];
	}
}

export default DocumentWatcher;

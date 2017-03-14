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

	constructor(
		private outputChannel = window.createOutputChannel('EditorConfig')
	) {
		this.log('Initializing document watcher...');

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

	private log(...messages: string[]) {
		this.outputChannel.appendLine(messages.join(' '));
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
		this.log('Rebuilding config map...');
		this.docToConfigMap = {};
		return Promise.all(workspace.textDocuments.map(
			doc => this.onDidOpenDocument(doc)
		));
	}

	private onDidOpenDocument(doc: TextDocument) {
		if (doc.isUntitled) {
			this.log('Skipped untitled document.');
			return Promise.resolve();
		}
		const fileName = doc.fileName;
		const relativePath = workspace.asRelativePath(fileName);
		this.log(`Applying configuration to ${relativePath}...`);

		if (this.docToConfigMap[fileName]) {
			this.log('Using configuration map...');
			this.applyEditorConfigToTextEditor(window.activeTextEditor);
			return Promise.resolve();
		}

		this.log('Using EditorConfig core...');
		return editorconfig.parse(fileName)
			.then((config: editorconfig.knownProps) => {
				if (config.indent_size === 'tab') {
					config.indent_size = config.tab_width;
				}

				this.docToConfigMap[fileName] = config;

				return this.applyEditorConfigToTextEditor(window.activeTextEditor);
			});
	}

	private applyEditorConfigToTextEditor(
		editor: TextEditor,
	) {
		if (!editor) {
			this.log('No more open editors.');
			return Promise.resolve();
		}

		const doc = editor.document;
		const relativePath = workspace.asRelativePath(doc.fileName);
		const editorconfig = this.getSettingsForDocument(doc);

		if (!editorconfig) {
			this.log(`No configuration for ${relativePath}.`);
			return Promise.resolve();
		}

		const newOptions = fromEditorConfig(
			editorconfig,
			this.getDefaultSettings()
		);

		// tslint:disable-next-line:no-any
		editor.options = newOptions as any;

		this.log(`${relativePath}: ${JSON.stringify(newOptions)}`);

		return endOfLineTransform(editorconfig, editor);
	}

	private onConfigChanged() {
		const workspaceConfig = workspace.getConfiguration('editor');
		const detectIndentation = workspaceConfig.get<boolean>('detectIndentation');

		this.defaults = (detectIndentation) ? {} : {
			tabSize: workspaceConfig.get<string | number>('tabSize'),
			insertSpaces: workspaceConfig.get<string | boolean>('insertSpaces')
		};
		this.log(
			'Detected change in configuration:',
			JSON.stringify(this.defaults)
		);
	}

	private calculatePreSaveTransformations(
		doc: TextDocument
	): TextEdit[] | void {
		const editorconfig = this.getSettingsForDocument(doc);
		const relativePath = workspace.asRelativePath(doc.fileName);

		if (!editorconfig) {
			this.log(`Pre-save: No configuration found for ${relativePath}.`);
			return;
		}

		this.log(`Applying pre-save transformations to ${relativePath}.`);

		return [
			...insertFinalNewlineTransform(editorconfig, doc),
			...trimTrailingWhitespaceTransform(editorconfig, doc)
		];
	}
}

export default DocumentWatcher;

import * as editorconfig from 'editorconfig';
import * as compact from 'lodash.compact';
import * as get from 'lodash.get';
import * as path from 'path';
import {
	window,
	workspace,
	Disposable,
	Selection,
	TextDocument,
	TextEditorOptions,
	TextEdit,
	TextDocumentSaveReason
} from 'vscode';
import languageExtensionMap from './languageExtensionMap';
import { fromEditorConfig } from './Utils';
import {
	InsertFinalNewline,
	PreSaveTransformation,
	SetEndOfLine,
	TrimTrailingWhitespace
} from './transformations';
import {
	EditorConfigProvider
} from './interfaces/editorConfigProvider';

export default class DocumentWatcher implements EditorConfigProvider {

	private disposable: Disposable;
	private defaults: TextEditorOptions;
	private preSaveTransformations: PreSaveTransformation[] = [
		new SetEndOfLine(),
		new TrimTrailingWhitespace(),
		new InsertFinalNewline()
	];
	private doc: TextDocument;

	constructor(
		private outputChannel = window.createOutputChannel('EditorConfig')
	) {
		this.log('Initializing document watcher...');

		const subscriptions: Disposable[] = [];

		subscriptions.push(window.onDidChangeActiveTextEditor(editor => {
			if (editor && editor.document) {
				this.resolveConfig(this.doc = editor.document);
			}
		}));

		subscriptions.push(window.onDidChangeWindowState(state => {
			if (state.focused) {
				this.resolveConfig(this.doc);
			}
		}));

		subscriptions.push(workspace.onDidChangeConfiguration(
			this.onConfigChanged.bind(this)
		));

		subscriptions.push(workspace.onDidSaveTextDocument(doc => {
			if (path.basename(doc.fileName) === '.editorconfig') {
				this.log('.editorconfig file saved.');
				this.onConfigChanged();
			}
		}));

		subscriptions.push(workspace.onWillSaveTextDocument(async e => {
			let selections: Selection[];
			const activeEditor = window.activeTextEditor;
			const activeDoc = get(activeEditor, 'document');
			if (activeDoc && activeDoc === e.document) {
				selections = window.activeTextEditor.selections;
			}
			const transformations = this.calculatePreSaveTransformations(
				e.document,
				e.reason
			);
			e.waitUntil(transformations);
			if (selections) {
				await transformations;
				activeEditor.selections = selections;
			}
		}));

		this.disposable = Disposable.from.apply(this, subscriptions);
		this.onConfigChanged();
	}

	private log(...messages: string[]) {
		this.outputChannel.appendLine(messages.join(' '));
	}

	public dispose() {
		this.disposable.dispose();
	}

	public async getSettingsForDocument(doc: TextDocument) {
		if (doc.languageId === 'Log') {
			return {};
		}
		const fileName = this.getFileName(doc);
		const relativePath = workspace.asRelativePath(fileName, true);

		this.log(`${relativePath}: Using EditorConfig core...`);
		const config = await editorconfig.parse(fileName);
		if (config.indent_size === 'tab') {
			config.indent_size = config.tab_width;
		}
		return config;
	}

	private getFileName(doc: TextDocument) {
		if (!doc.isUntitled) {
			return doc.fileName;
		}
		const ext = languageExtensionMap[doc.languageId] || doc.languageId;
		return path.join(
			...compact([
				workspace.getWorkspaceFolder(doc.uri),
				`${doc.fileName}.${ext}`
			])
		);
	}

	public getDefaultSettings() {
		return this.defaults;
	}

	private async resolveConfig(doc: TextDocument) {
		const editor = window.activeTextEditor;
		if (!editor) {
			this.log('No more open editors.');
			return;
		}

		const relativePath = workspace.asRelativePath(doc.fileName, true);
		const editorconfigSettings = await this.getSettingsForDocument(doc);

		if (!editorconfigSettings) {
			this.log(`${relativePath}: No configuration.`);
			return;
		}

		const newOptions = fromEditorConfig(
			editorconfigSettings,
			this.getDefaultSettings()
		);

		// tslint:disable-next-line:no-any
		editor.options = newOptions as any;

		this.log(`${relativePath}: ${JSON.stringify(newOptions)}`);
	}

	private onConfigChanged() {
		const workspaceConfig = workspace.getConfiguration('editor', null);
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

	private async calculatePreSaveTransformations(
		doc: TextDocument,
		reason: TextDocumentSaveReason
	): Promise<TextEdit[]> {
		const editorconfigSettings = await this.getSettingsForDocument(doc);
		const relativePath = workspace.asRelativePath(doc.fileName);

		if (!editorconfigSettings) {
			this.log(`${relativePath}: No configuration found for pre-save.`);
			return [];
		}

		return Array.prototype.concat.call([],
			...this.preSaveTransformations.map(
				transformer => {
					const { edits, message } = transformer.transform(
						editorconfigSettings,
						doc,
						reason
					);
					if (edits instanceof Error) {
						this.log(`${relativePath}: ${edits.message}`);
					}
					if (message) {
						this.log(`${relativePath}: ${message}`);
					}
					return edits;
				}
			)
		);
	}
}

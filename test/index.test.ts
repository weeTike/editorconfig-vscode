'use strict';

import * as assert from 'assert';
import {
	Position,
	window,
	workspace,
	WorkspaceEdit
} from 'vscode';
import {
	getFixturePath,
	getOptionsForFixture
} from './testUtils';

import * as utils from 'vscode-test-utils';

suite('EditorConfig extension', () => {

	suiteTeardown(utils.closeAllFiles);

	test('indent_style = tab; tab_width = n', async () => {
		for (const n of [2, 3, 4]) {
			const options = await getOptionsForFixture([`tab-width-${n}`]);
			assert.strictEqual(
				options.insertSpaces,
				false,
				`editor has insertSpaces: false`
			);
			assert.strictEqual(
				options.tabSize,
				n,
				`editor has a tabSize of ${n}`
			);
		}
	});

	test('indent_style = space; indent_size = n', async () => {
		for (const n of [2, 3, 4]) {
			const options = await getOptionsForFixture([`indent-size-${n}`]);
			assert.strictEqual(
				options.insertSpaces,
				true,
				`editor has insertSpaces: true`
			);
			assert.strictEqual(
				options.tabSize,
				n,
				`editor has a tabSize of ${n}`
			);
		}
	});

	test('subfolder settings', async () => {
		for (const n of [2, 3, 4, 'x']) {
			const options = await getOptionsForFixture(['folder', `tab-width-${n}`]);
			const expectedTabSize = (n === 'x') ? 8 : n;
			assert.strictEqual(
				options.insertSpaces,
				false,
				`editor has insertSpaces: false`
			);
			assert.strictEqual(
				options.tabSize,
				expectedTabSize,
				`editor has a tabSize of ${expectedTabSize}`
			);
		}
	});

	test('insert_final_newline = true', async () => {
		const savedText = await withSetting(
			'insert_final_newline',
			'true',
			{ saves: 2 }
		).saveText('foo');
		assert.strictEqual(savedText, 'foo\n',
			'editor inserts final newline on save');
	});

	test('insert_final_newline = false', async () => {
		const savedText = await withSetting(
			'insert_final_newline',
			'false'
		).saveText('foo\n');
		assert.strictEqual(savedText, 'foo\n',
			'editor preserves final newline on save');
	});

	test('trim_trailing_whitespace = true', async () => {
		const savedText = await withSetting(
			'trim_trailing_whitespace',
			'true',
			{ saves: 2 }
		).saveText('foo  ');
		assert.strictEqual(savedText, 'foo',
			'editor trims trailing whitespace on save');
	});

	test('trim_trailing_whitespace = false', async () => {
		const savedText = await withSetting(
			'trim_trailing_whitespace',
			'false'
		).saveText('foo  ');
		assert.strictEqual(savedText, 'foo  ',
			'editor preserves trailing whitespace on save');
	});

});

function withSetting(
	rule: string,
	value: string,
	options?: {
		saves?: number;
	}
) {
	options = options || {};
	return {
		saveText: async (text: string) => {
			const filename = await utils.createFile('', getFixturePath([
				rule,
				value,
				'test'
			]));
			const doc = await workspace.openTextDocument(filename);
			await window.showTextDocument(doc);
			const edit = new WorkspaceEdit();
			edit.insert(doc.uri, new Position(0, 0), text);
			assert.strictEqual(
				await workspace.applyEdit(edit),
				true,
				'applies edit'
			);
			return await new Promise(resolve => {
				let saveCount = 0;
				workspace.onDidSaveTextDocument(savedDoc => {
					if (++saveCount === (options.saves || 1)) {
						resolve(savedDoc.getText());
					}
				});
				doc.save();
			});
		}
	};
}

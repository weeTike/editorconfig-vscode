'use strict';

import * as assert from 'assert';
import {
	cleanUpWorkspace,
	getOptionsForFixture
} from './testUtils';

suite('EditorConfig extension', () => {

	suiteTeardown(cleanUpWorkspace);

	test('indent_style: tab, tab_width: n', async () => {
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

	test('indent_style: space, indent_size: n', async () => {
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

});

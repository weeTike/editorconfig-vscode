'use strict';

import * as assert from 'assert';
import {
	cleanUpWorkspace,
	getOptionsForFixture
} from './testUtils';

suite('EditorConfig extension', () => {

	suiteTeardown(cleanUpWorkspace);

	test('tab_width setting', async () => {
		for (const n of [2, 3, 4]) {
			const options = await getOptionsForFixture([`tab-width-${n}`]);
			assert.strictEqual(
				options.tabSize,
				n,
				`editor has a tabSize of ${n}`
			);
		}
	});

	test('indent_size setting', async () => {
		for (const n of [2, 3, 4]) {
			const options = await getOptionsForFixture([`indent-size-${n}`]);
			assert.strictEqual(
				options.tabSize,
				n,
				`editor has a tabSize of ${n}`
			);
		}
	});

});

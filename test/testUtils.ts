import * as assert from 'assert';
import * as path from 'path';
import {
	TextEditorOptions,
	window
} from 'vscode';
import * as utils from 'vscode-test-utils';

export async function getOptionsForFixture(file: string[]) {
	await utils.openFile(getFixturePath(file));
	return await getTextEditorOptions();
}

export function getFixturePath(file: string[]) {
	return path.join(
		...([
			__dirname,
			'..',
			'..',
			'test',
			'fixtures'
		].concat(file))
	);
}

/**
 * Waits for a specified amount of time, specified in milliseconds.
 * @param wait The number of milliseconds to wait.
 */
export function wait(ms?: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function getTextEditorOptions() {
	let resolved = false;

	return new Promise<TextEditorOptions>(async (resolve) => {
		window.onDidChangeTextEditorOptions(e => {
			resolved = true;
			assert.ok(e.options);
			resolve(e.options);
		});
		await wait(100);
		if (resolved) {
			return;
		}
		assert.ok(window.activeTextEditor.options);
		resolve(window.activeTextEditor.options);
	});
}

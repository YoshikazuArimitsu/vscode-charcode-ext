import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.equal(-1, [1, 2, 3].indexOf(5));
		assert.equal(-1, [1, 2, 3].indexOf(0));
	});

	test('結合文字(UNICODE)', () => {
		const c = '\u30DB\u309A';	// ポ
		assert.equal(
			'UNICODE: U+30DB U+309A (combined)',
			myExtension.buildStatusTextCombine(c, myExtension.EncodingEnum.UNICODE)
		);
	});

	test('結合文字(UTF-8)', () => {
		const c = '\u30DB\u309A';	// ポ
		assert.equal(
			'UTF8: U+E3839B U+E3829A (combined)',
			myExtension.buildStatusTextCombine(c, myExtension.EncodingEnum.UTF8)
		);
	});

	test('結合文字(無処理)', () => {
		const c = 'ポ';
		assert.equal(
			null,
			myExtension.buildStatusTextCombine(c, myExtension.EncodingEnum.UNICODE)
		);
	});

	test('サロゲートペア(UNICODE)', () => {
		const c = '\uD867\uDE3D';	// 𩸽
		assert.equal(
			'UNICODE: U+D867 U+DE3D (surrogate)',
			myExtension.buildStatusTextSurrogate(c, myExtension.EncodingEnum.UNICODE)
		);
	});

	test('サロゲートペア(UTF-8)', () => {
		const c = '\uD867\uDE3D';	// 𩸽
		assert.equal(
			'UTF8: U+F0A9B8BD (surrogate)',
			myExtension.buildStatusTextSurrogate(c, myExtension.EncodingEnum.UTF8)
		);
	});

	test('サロゲートペア(無処理)', () => {
		const c = '鬱';
		assert.equal(
			null,
			myExtension.buildStatusTextSurrogate(c, myExtension.EncodingEnum.UNICODE)
		);
	});
});


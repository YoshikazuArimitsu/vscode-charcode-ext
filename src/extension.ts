import * as vscode from 'vscode';
import * as encjap from "encoding-japanese";


export enum EncodingEnum {
	UNICODE = 'UNICODE',
	UTF8 = 'UTF8',
	SJIS = 'SJIS',
	EUCJP = 'EUCJP'
}

let myStatusBarItem: vscode.StatusBarItem;
let encoding = EncodingEnum.UNICODE;

export async function showQuickPick() {
	const keys = Object.keys(EncodingEnum);
	const result = await vscode.window.showQuickPick(keys, {
		placeHolder: 'select encoding charset'
	});
	console.log(`select charset ${result}`);
	encoding = <EncodingEnum>(result);
}

export function activate({subscriptions}: vscode.ExtensionContext) {
	const myCommandId = 'charcode.selectEncoding';
	subscriptions.push(vscode.commands.registerCommand(myCommandId, async () => {
		await showQuickPick();
		updateStatusBarItem();
	}));

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = myCommandId;
	subscriptions.push(myStatusBarItem);

	// register some listener that make sure the status bar 
	// item always up-to-date
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
	subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

	// update status bar item once at start
	updateStatusBarItem();
}

function updateStatusBarItem(): void {
	const s = getCaretText(vscode.window.activeTextEditor);
	const message = buildStatusText(s);

	if (message.length > 0) {
		myStatusBarItem.text = message;
		myStatusBarItem.show();
	} else {
		myStatusBarItem.hide();
	}
}

function getCaretText(editor: vscode.TextEditor | undefined): string {
	if (editor) {
		let cursorPosition = editor.selection.start;
		let nextPosisiton = new vscode.Position(cursorPosition.line, cursorPosition.character + 2);
		let r = new vscode.Range(cursorPosition, nextPosisiton);
		return editor.document.getText(r);
	}
	return "";
}

/**
 * 結合文字列版処理文字コード取得処理
 * @param text 
 * @returns 
 */
export function buildStatusTextCombine(text: string, _encondig: EncodingEnum): string | null {
	if(text.length <= 1 || (_encondig != EncodingEnum.UNICODE && _encondig != EncodingEnum.UTF8))
		return null;

	// 結合文字判定
	const nfc = text.normalize('NFC')
	if(nfc.length != 1)
		return null;

	const chars = [text.charAt(0), text.charAt(1)]
	const encs = chars.map((ch:string) => {
		const encarray = encjap.convert(ch, {
			to: _encondig,
			from: 'UNICODE',
			type: 'array'
		}) as number[];

		return encarray.map((c:number) => {
			return c.toString(16).toUpperCase().padStart(2, '0');
		}).join('');
	})

	const enc = encs.map((s:string) => `U+${s}`).join(' ')
	return `${_encondig}: ${enc} (combined)`
}

/**
 * サロゲートペア文字コード取得処理
 * @param text 
 * @returns 
 */
export function buildStatusTextSurrogate(text: string, _encondig:EncodingEnum): string | null {
	if(text.length <= 1 || (_encondig != EncodingEnum.UNICODE && _encondig != EncodingEnum.UTF8))
		return null;

	var c1 = text.charCodeAt(0);
	var c2 = text.charCodeAt(1);

	if ((0xD800 <= c1 && c1 <= 0xDBFF) || (0xDC00 <= c2 && c2 <= 0xDFFF)) { 
	} else {
		return null;
	}

	const encarray = encjap.convert(text, {
		to: _encondig,
		from: 'UNICODE',
		type: 'array'
	}) as number[];

	const arrayToCodeStr = (ea:number[]):string => {
		if(_encondig == EncodingEnum.UNICODE) {
			// Unicode (U+xxxx U+xxxx)
			return ea.map((c:number) => {
				return `U+${c.toString(16).toUpperCase().padStart(2, '0')}`;
			}).join(' ');
		} else {
			// UTF-8 (U+xxxxxxxx)
			return 'U+' + ea.map((c:number) => {
				return `${c.toString(16).toUpperCase().padStart(2, '0')}`;
			}).join('');
		}
	}

	const enc = arrayToCodeStr(encarray);

	return `${_encondig}: ${enc} (surrogate)`
}

function buildStatusText(text: string): string {
	if(text.length) {
		// 結合文字処理
		const r = buildStatusTextCombine(text, encoding);
		if(r) return r;

		// サロゲートペア文字処理
		const sr = buildStatusTextSurrogate(text, encoding);
		if(sr) return sr;

		// 通常文字処理
		const cc = text.charCodeAt(0);
		const encarray = encjap.convert(text.substring(0, 1), {
			to: encoding,
			from: 'UNICODE',
			type: 'array'
		}) as number[];
		
		const enc = encarray.map((c:number) => {
			return c.toString(16).toUpperCase().padStart(2, '0');
		}).join('');

		// console.log(`caret char=${cc} len=${text.length} char=${text} U+${cc.toString(16)}, enc=${enc}`);
		const ud = (encoding == EncodingEnum.UNICODE || encoding == EncodingEnum.UTF8) ?
			'U+' : '';

		return `${encoding}: ${ud}${enc}`
	} else {
		// console.log(`caret len=${text.length} char=${text}`);
	}
	return '';
}
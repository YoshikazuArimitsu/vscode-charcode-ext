import * as vscode from 'vscode';
import * as encjap from "encoding-japanese";


enum EncodingEnum {
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
		let nextPosisiton = new vscode.Position(cursorPosition.line, cursorPosition.character + 1);
		let r = new vscode.Range(cursorPosition, nextPosisiton);
		return editor.document.getText(r);
	}
	return "";
}

function buildStatusText(text: string): string {
	if(text.length) {
		const cc = text.charCodeAt(0);
		const encarray = encjap.convert(text, {
			to: encoding,
			from: 'UNICODE',
			type: 'array'
		  }) as number[];
		
		let enc = encarray.map((c:number) => {
			return c.toString(16).toUpperCase().padStart(2, '0');
		}).join('');

		console.log(`caret len=${text.length} char=${text} U+${cc.toString(16)}, enc=${enc}`);
		const ud = (encoding == EncodingEnum.UNICODE || encoding == EncodingEnum.UTF8) ?
			'U+' : '';
		return `${encoding}: ${ud}${enc}`
	} else {
		console.log(`caret len=${text.length} char=${text}`);
	}
	return '';
}
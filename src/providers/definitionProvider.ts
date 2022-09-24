'use strict';

import {
    DefinitionProvider as vsDefinitionProvider,
    TextDocument,
    ProviderResult,
    Position,
    Location,
    LocationLink
} from "vscode";
import * as util from '../util';

export default class DefinitionProvider implements vsDefinitionProvider {
    public provideDefinition(doc: TextDocument, position: Position): ProviderResult<Location | LocationLink[]> {
      const line = doc.lineAt(position.line);
      const lineText = line.text;
			const lineTextPosition = doc.getText(doc.getWordRangeAtPosition(position));
			const htmlResult = lineText.match(util.HTML_REG);
			if (htmlResult !== null) {
				for (let item of htmlResult) {
					if (!item.includes(lineTextPosition)) {
						continue;
					}
					let strExt = '';
					let type = '';
					if (item.includes('.html')) {
						strExt = '.html';
						type = 'view'; 
					} else if (item.includes('.css')) {
						strExt = '.css';
						type = 'css';
					} else if (item.includes('.js')) {
						strExt = '.js';
						type = 'js';
					}
					if (strExt !== '' && type !== '') {
						const findIndex = item.indexOf(strExt);
						const quotesType = item[findIndex + strExt.length]; // 引号类型
						let pathText = item.substring(0, findIndex + strExt.length);
						pathText = pathText.substring(pathText.lastIndexOf(quotesType) + 1);
						if (pathText.startsWith('/')) {
							pathText = pathText.substring(1);
						}
						let file = util.getFilePath(pathText, doc, type);
						if (file !== null) {
							// new vscode.Position(0, 0) 表示跳转到某个文件的第一行第一列
							return new Location(file, new Position(0, 0));
						};
					}
				}
			}
    }
}
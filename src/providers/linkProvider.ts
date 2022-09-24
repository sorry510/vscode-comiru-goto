'use strict';

import {
    DocumentLinkProvider as vsDocumentLinkProvider,
    TextDocument,
    ProviderResult,
    DocumentLink,
    workspace,
    Position,
    Range
} from "vscode";
import * as util from '../util';

export default class LinkProvider implements vsDocumentLinkProvider {
    public provideDocumentLinks(doc: TextDocument): ProviderResult<DocumentLink[]> {
        let documentLinks = [];
        let config = workspace.getConfiguration('comiru_goto');

        let linesCount = doc.lineCount <= config.maxLinesCount ? doc.lineCount : config.maxLinesCount;
        let index = 0;
        while (index < linesCount) {
            const line = doc.lineAt(index);
            const lineText = line.text;

            const viewResult = lineText.match(util.VIEW_REG);
            if (viewResult !== null) {
                for (let item of viewResult) {
                    const prefixStr = 'app->render(';
                    const pathText = item.substring(prefixStr.length).replace(/\"|\'/g, ''); // 去除单双引号和前缀
                    let file = util.getFilePath(pathText, doc, 'view');

                    if (file !== null) {
                        let start = new Position(line.lineNumber, lineText.indexOf(item) + prefixStr.length);
                        let end = start.translate(0, pathText.length);
                        let documentLink = new DocumentLink(new Range(start, end), file);
                        documentLinks.push(documentLink);
                    };
                }
            }

            const htmlResult = lineText.match(util.HTML_REG);
            if (htmlResult !== null) {
                for (let item of htmlResult) {
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
                            let start = new Position(line.lineNumber, lineText.indexOf(pathText));
                            let end = start.translate(0, pathText.length);
                            let documentLink = new DocumentLink(new Range(start, end), file);
                            // if words has link，new link is invalid, so i use hover instead
                            // example vscode in html file built-in link will make this extension invalid
                            //  <script src="{{ asset('/js/test.js') }}"></script>
                            //  <link rel="stylesheet" href="{{ asset('/css/test.css') }}">
                            documentLinks.push(documentLink);
                        };
                    }
                }
            }
            index++;
        }

        return documentLinks;
    }
}
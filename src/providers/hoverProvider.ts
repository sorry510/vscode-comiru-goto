'use strict';

import {
    HoverProvider as vsHoverProvider,
    TextDocument,
    Position,
    ProviderResult,
    Hover,
    Uri,
    MarkdownString
} from "vscode";
import * as util from '../util';

export default class HoverProvider implements vsHoverProvider {
  provideHover(doc: TextDocument, position: Position): ProviderResult<Hover> {
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
          let result = util.getFilePath(pathText, doc, type);
          if (result !== null) {
            const text = Uri.file(result.targetPath).toString();
            return new Hover(new MarkdownString(`[comiru goto: ${pathText}](${text})`));
          };
        }
      }
    }

    const routerResult = lineText.match(util.ROUTER_HTML_REG);
    if (routerResult !== null) {
      for (let item of routerResult) {
          let prefixStr = '';
          if (item.indexOf('app.path(') !== -1) {
              prefixStr = 'app.path(';
          } else if (item.indexOf('app.url(') !== -1) {
              prefixStr = 'app.url(';
          }
          
          const pathText = item.substring(prefixStr.length).replace(/\"|\'/g, ''); // 去除单双引号和前缀
          let result = util.getFilePath(pathText, doc, 'router');

          if (result !== null) {
              const path = result.targetPath;
              const filePosition = Uri.parse(`${path}#${result.line}`).toString();
              return new Hover(new MarkdownString(`[comiru goto: ${pathText}](${filePosition})`));
          };
      }
    }
  }
}
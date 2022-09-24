'use strict';

import { workspace, TextDocument, DocumentLink, Range, Uri } from 'vscode';
import * as fs from 'fs';
// import * as readLine from 'n-readlines';

const configurationNamespace = 'comiru_goto';

/**
 * Finds the controller's filepath
 * @param text example A/FooController
 * @param document
 * @param type example view
 */
export function getFilePath(text: string, document: TextDocument, type: string) {
  const workspaceFolder = workspace.getWorkspaceFolder(document.uri)?.uri.fsPath || '';
  let strConfigPath = workspace.getConfiguration(configurationNamespace);

  const dirHash: any = {
    'view': 'pathViews',
    'css': 'pathCss',
    'js': 'pathJs',
  };

  if (!dirHash[type]) {
    return null;
  }

  for (let configPath of strConfigPath[dirHash[type]].split(',')) {
    let filePath = workspaceFolder + configPath.trim();
    if (!fs.existsSync(filePath)) {
      // 目录不存在，跳过
      continue;
    }

    if (text.startsWith('css')) {
      // replace css to sass
      text = 'sass' + text.substring(3);
    }

    if (text.endsWith('.css')) {
      text = text.slice(0, -3) + 'scss';
    }

    let targetPath = `${filePath}/${text}`;

    if (fs.existsSync(targetPath)) {
      return Uri.file(targetPath);
    }
  }
  return null;
}

// /**
//  * @param text example bar
//  * @param path
//  */
// export function getLineNumber(text: string, path: string) {
//     let file = new readLine(path);
//     let lineNum = 0;
//     let line: string;
//     while (line = file.next()) {
//         lineNum++;
//         line = line.toString();
//         if (line.toLowerCase().includes('function ' + text.toLowerCase() + '(') ||
//           line.toLowerCase().includes('function ' + text.toLowerCase() + ' (')
//         ) {
//             return lineNum;
//         }
//     }
//     return -1;
// }

export const VIEW_REG = /app-\>render\((['"])[^'"]*\1/g;

export const HTML_REG = /(['"])[^'"]*\.[html|css|js][^'"]*\1/g;

export const ROUTE_REG = /app-\>render\((['"])[^'"]*\1/g;
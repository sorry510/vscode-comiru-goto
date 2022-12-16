'use strict';

import { workspace, TextDocument } from 'vscode';
import * as fs from 'fs';
const readLine = require('n-readlines');
// import * as readLine from 'n-readlines';

const configurationNamespace = 'comiru_goto';

/**
 * Finds the controller's filepath
 * @param text example A/FooController
 * @param document
 * @param type example view
 */
export function getFilePath(text: string, document: TextDocument, type: string, search?: string) {
  const workspaceFolder = workspace.getWorkspaceFolder(document.uri)?.uri.fsPath || '';
  let strConfigPath = workspace.getConfiguration(configurationNamespace);

  const dirHash: any = {
    'view': 'pathViews',
    'css': 'pathCss',
    'js': 'pathJs',
    'model': 'pathModel',
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
      if (search) {
        const line = getLineNumber(search, targetPath);
        return { line, targetPath };
      }
      return { targetPath };
    }
  }
  return null;
}

/**
 * @param text example bar
 * @param path
 */
export function getLineNumber(text: string, path: string) {
    let file = new readLine(path);
    let lineNum = 0;
    let line: any;
    while (line = file.next()) {
        lineNum++;
        line = line.toString();
        if (line.toLowerCase().includes('function ' + text.toLowerCase() + '(') ||
          line.toLowerCase().includes('function ' + text.toLowerCase() + ' (')
        ) {
            return lineNum;
        }
    }
    return -1;
}

export const VIEW_REG = /app-\>render\((['"])[^'"]*\1/g;

export const HTML_REG = /(['"])[^'"]*\.[html|css|js][^'"]*\1/g;

export const MODEL_KEY_REG = /app\[(['"])m\.[^'"]*\1/g;

export const MODEL_ORM_KEY_REG = /app\[(['"])orm\.[^'"]*\1/g;
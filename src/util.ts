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
    'router': 'pathRouter',
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

    if (type === 'router') {
      // 遍历路由文件夹
      return findInDir(filePath, text);
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
        if (line === -1) {
          // in traits
          const newTargetPath = `${filePath}/Traits/CommonTrait.php`;
          const newLine = getLineNumber(search, newTargetPath);
          if (newLine > -1) {
            return { line: newLine, newTargetPath: newTargetPath, targetPath };
          }
        }
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
function getLineNumber(text: string, path: string) {
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

function findInDir(dir: string, text: string) {
  const files = fs.readdirSync(dir);
  for (const filename of files) {
    const targetPath = `${dir}/${filename}`;
    if (fs.existsSync(targetPath)) {
      let file = new readLine(`${dir}/${filename}`);
      let lineNum = 0;
      let line: any;
      while (line = file.next()) {
          lineNum++;
          line = line.toString();
          if (line.indexOf(`'${text}'`) !== -1 || line.indexOf(`"${text}"`) !== -1) {
            return { line: lineNum, targetPath };
          }
      }
    }
  }
  return null;
}

export const VIEW_REG = /app-\>render\((['"])[^'"]*\1/g;

export const HTML_REG = /(['"])[^'"]*\.[html|css|js][^'"]*\1/g;

export const MODEL_KEY_REG = /app\[(['"])m\.[^'"]*\1/g;

export const MODEL_ORM_KEY_REG = /app\[(['"])orm\.[^'"]*\1/g;

export const ROUTER_PHP_REG = /app-\>path\((['"])[^'"]*|app-\>url\((['"])[^'"]*\1/g;

export const ROUTER_HTML_REG = /app\.path\((['"])[^'"]*|app\.url\((['"])[^'"]*\1/g;
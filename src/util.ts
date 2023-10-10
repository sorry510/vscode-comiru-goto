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
  const appDiMap = strConfigPath.pathAppDiMap;
  const schoolMap = strConfigPath.pathSchoolMap;
  
  // 先处理白名单
  if (type === 'appDiMap') {
    if (appDiMap[text]) {
      if (typeof appDiMap[text] === 'string') {
        let filePath = workspaceFolder + appDiMap[text];
        return findInFile(filePath, `app['${text}']`, false);
      } else {
        // di app object
        const { path } = appDiMap[text];
        let targetPath = workspaceFolder + path;
        return {
          targetPath
        };
      }
    }
    return null;
  } else if (type === 'schoolMap') {
    if (schoolMap[text]) {
      if (typeof schoolMap[text] === 'string') {
        let filePath = workspaceFolder + schoolMap[text];
        return findInFile(filePath, text, false);
      } else {
        
      }
    }
    return null;
  }

  const dirHash: any = {
    'view': 'pathViews',
    'css': 'pathCss',
    'js': 'pathJs',
    'model': 'pathModel',
    'router': 'pathRouter',
    'middleware': 'pathMiddleware',
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

    if (type === 'middleware') {
      const [middleware, method = ''] = text.split(':');
      const hasMapFile = workspaceFolder + '/src/App/Providers/AppServiceProvider.php';
      if (fs.existsSync(hasMapFile)) {
        let file = new readLine(hasMapFile);
        let line: any;
        while (line = file.next()) {
            line = line.toString();
            if (line.includes(middleware)) {
              const result = line.match(/=> Middleware\\(.*)::class/);
              if (result && result.length > 1) {
                const fileName = result[1] + '.php';
                let targetPath = `${filePath}/${fileName}`;
                if (fs.existsSync(targetPath)) {
                  if (method) {
                    const line = getLineNumber(method, targetPath);
                    if (line !== -1) {
                      return { line, targetPath };
                    }
                  }
                  return { targetPath };
                }
              }
            }
        }
      }
      return null;
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

function findInDir(dir: string, text: string, addMask = true): any {
  const files = fs.readdirSync(dir);
  for (const filename of files) {
    const targetPath = `${dir}/${filename}`;
    if (fs.statSync(targetPath).isDirectory()) {
      var result = findInDir(targetPath, text);
      if (result) {
        return result;
      }
    } else if (fs.existsSync(targetPath)) {
      var result = findInFile(targetPath, text, addMask);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

function findInFile(path: string, text: string, addMask = true): any {
  let file = new readLine(path);
  let lineNum = 0;
  let line: any;
  while (line = file.next()) {
    lineNum++;
    line = line.toString();
    if (addMask) {
      if (line.indexOf(`'${text}'`) !== -1 || line.indexOf(`"${text}"`) !== -1) {
        return { line: lineNum, targetPath: path };
      }
    } else {
      if (line.indexOf(text) !== -1 || line.indexOf(text) !== -1) {
        return { line: lineNum, targetPath: path };
      }
    }
  }
}

export const VIEW_REG = /app-\>render\((['"])[^'"]*\1/g;

export const HTML_REG = /(['"])[^'"]*\.[html|css|js][^'"]*\1/g;

export const MODEL_KEY_REG = /app\[(['"])m\.[^'"]*\1/g;

export const MODEL_ORM_KEY_REG = /app\[(['"])orm\.[^'"]*\1/g;

export const ROUTER_PHP_REG = /app-\>path\((['"])[^'"]*|app-\>url\((['"])[^'"]*\1/g;

export const ROUTER_HTML_REG = /app\.path\((['"])[^'"]*|app\.url\((['"])[^'"]*\1/g;

export const MIDDLEWARE_REG = /(['"])middleware\.[^'"]*\1/g;  // 'before' => ['middleware.before.domain_redirect:douga']

export const APP_DI_REG = /app\[(['"])[^'"]*\1/g;

export const SCHOOL_REG = /school\[(['"])[^'"]*\1/g;
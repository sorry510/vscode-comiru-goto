'use strict';

import { languages, ExtensionContext } from 'vscode';
import LinkProvider from './providers/linkProvider';
import HoverProvider from './providers/hoverProvider';
// import DefinitionProvider from './providers/definitionProvider';

export function activate(context: ExtensionContext) {
    const link = languages.registerDocumentLinkProvider(['php', 'html'], new LinkProvider());
	const hover = languages.registerHoverProvider(['php', 'html'], new HoverProvider());
    context.subscriptions.push(link, hover);

	// ctrl and show, use hover instead
	// const def = languages.registerDefinitionProvider(['html'], new DefinitionProvider());
	// context.subscriptions.push(def);
}

export function deactivate() {
    //
}
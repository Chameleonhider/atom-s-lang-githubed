'use babel';

import * as slang_main from './s-lang-classes';

var main_data;

class CompletionProvider {
	constructor() {
	    this.selector = '*';
		this.disableForSelector = '.js';
	    this.inclusionPriority = 10;
		this.excludeLowerPriority = true;
		this.suggestionPriority = 10;

		main_data = new slang_main.main();
	}
	getSuggestions({editor, bufferPosition, prefix}) {
		try {
			if (editor != undefined) {
				filePath = editor.getPath();
				// fileName = editor.getLongTitle();
				// fileFolder = filePath.substring(0, filePath.lastIndexOf(fileName));
			} else {
				console.error('ERR: editor is null');
				return;
			}

			if (!main_data.checkParse(filePath)){
				main_data.addFile(filePath);
				main_data.reparseFiles();
			}
		} catch (err){
			console.error("CAUGHT EXCEPTION "+err);
		}

		var line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);

		// split on whitespaces
		line = line.replace(/\s/gm, ' ');
		var splitIndex = line.lastIndexOf(' ');
		if (splitIndex != -1){
			line = line.substring(splitIndex+1);
		}
		if (line.length < 1) return;

		// split the line, get rid of = , - + etc.
		splitIndex = line.search(slang_main.charStringSplit);
		while (splitIndex != -1){
			line = line.substring(splitIndex+1);
			splitIndex = line.search(slang_main.charStringSplit);
		}

		// replace forbidden chars
		line.replace(slang_main.charForbidden, "");
		if (line.length < 1) return;

		// no autosuggest, just query
		if (line.lastIndexOf("?") === line.length-1){
			return main_data.getEntry(filePath, line);
		}
		// autosuggest
		return main_data.getEntries(filePath, line);
	}
}

module.exports = CompletionProvider;

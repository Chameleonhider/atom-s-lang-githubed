'use babel';

import AtomSLangView from './atom-s-lang-view';
import * as slang_parse from './s-lang-parse';
import * as slang_main from './s-lang-classes'; //not needed
import { CompositeDisposable } from 'atom';

class atom_slang {

}

var main_data;

export default {

	atomSLangView: null,
	modalPanel: null,
	subscriptions: null,

	activate(state) {
		this.atomSLangView = new AtomSLangView(state.atomSLangViewState);
		// this.modalPanel = atom.workspace.addModalPanel({
		// 	item: this.atomSLangView.getElement(),
		// 	visible: true
		// });
		this.modalPanel = atom.workspace.addBottomPanel({
			item: this.atomSLangView.getElement(),
			visible: true
		});

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		// Register command that toggles this view
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'atom-s-lang:toggle': () => this.toggle()
		}));
		// this.subscriptions.add(atom.commands.add('atom-workspace', {
		// 	'core:save': () => this.parseFile_onSave()
		// }));

		main_data = new slang_main.main();
	},

	deactivate() {
		this.modalPanel.destroy();
		this.subscriptions.dispose();
		this.atomSLangView.destroy();
	},

	serialize() {
		return {
			atomSLangViewState: this.atomSLangView.serialize()
		};
	},

	toggle() {
		this.parseFile_onSave();
		return (
			this.modalPanel.isVisible() ?
			this.modalPanel.hide() :
			this.modalPanel.show()
		);
	},

	parseFile_onSave() {
		log = 'parseFile_save()';
		openEditor = atom.workspace.getActiveTextEditor();
		if (openEditor != ``) {
			filePath = openEditor.getPath();
			fileName = openEditor.getLongTitle();
			fileFolder = filePath.substring(0, filePath.lastIndexOf(fileName));
			log += '\nLOG: file open '+fileName+' in '+fileFolder;

			//Debug info
			atom.notifications.addInfo('File info:', {
				buttons: null,
				description: '',
				detail: 'Name: '+fileName
					+'\nPath: '+filePath
					+'\nFolder '+fileFolder,
				dismissable: true,
				icon: 'info',
			});
		} else {
			log += '\nERR: openEditor is null';
			console.error(log);
			log = '';
			return;
		}

		// Open file sync https://discuss.atom.io/t/basic-file-read/38228
		const fs = require("fs");
		// var data = fs.readFileSync(filePath);
		// log += '\nLOG: Synchronous read: '+data.toString().substring(0,100)+'\n---END OF FILE READ---';
		// Open file async
		fs.readFile(filePath, function read(err, data) {
		    if (err) {
				log += '\nERR: '+err;
				console.log(log);
				log = '';
				return;
		    }

			log += '\nLOG: file '+filePath+' opened for async read, no error';
			console.log(log);
			log = '';
		    processFile(filePath, data);
		});

		// Save file -> triggers parsing, adds parsed files to global list
		// 	Parsing:
		// 		Check if required files have been parsed:
		// 			add them to this file
		// 		or
		// 			parse required files
		// 			add them to global list and to this file
		//
		// 		Parse own file, add to global list
		//
		// Global list contains files
		// Files contain variables (variables can be struct or function too)

		/* //works:
		let editor;
		if (editor = atom.workspace.getActiveTextEditor()) {
			let selection = editor.getSelectedText();
			let reversed = selection.split('').reverse().join('');
    		editor.insertText(reversed);
		}*/
	}
};

function processFile(file, data) {
	main_data.addFile(slang_parse.slang_parser.parseData(file, data));
}

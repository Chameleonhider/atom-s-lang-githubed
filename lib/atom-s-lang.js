'use babel';

import AtomSLangView from './atom-s-lang-view';
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
		// this.subscriptions.add(atom.commands.add('atom-workspace', {
		// 	'atom-s-lang:toggle': () => this.parseFile_onSave()
		// }));
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'core:save': () => this.parseFile_onSave()
		}));

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

	// toggle() {
	// 	this.parseFile_onSave();
	// 	return (
	// 		this.modalPanel.isVisible() ?
	// 		this.modalPanel.hide() :
	// 		this.modalPanel.show()
	// 	);
	// },

	parseFile_onSave() {
		try {
			openEditor = atom.workspace.getActiveTextEditor();
			if (openEditor != ``) {
				filePath = openEditor.getPath();
				fileName = openEditor.getLongTitle();
				fileFolder = filePath.substring(0, filePath.lastIndexOf(fileName));

				//Debug info
				atom.notifications.addInfo('File info:', {
					buttons: null,
					description: '',
					detail: 'Name: '+fileName
						+'\nPath: '+filePath,
					dismissable: true,
					icon: 'info',
				});
			} else {
				console.error('ERR: openEditor is null');
				return;
			}

			main_data.addFile(filePath);
			main_data.reparseFiles();
		} catch (ex){
			console.error("CAUGHT EXCEPTION "+ex);
		}
	}
};

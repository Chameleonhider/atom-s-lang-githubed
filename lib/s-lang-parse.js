'use babel';

import * as slang_main from './s-lang-classes';

export class slang_parser {
	static parseData(file, data) {
		lines = data.toString().split(/\n|;/); //use "/\n|;/" for alternative
		for (i=0; i<lines.length; i++) {
			if (lines[i].length == 1){
				console.log("\n--- MET EMPTY LINE --- "+i);
			}
			else{
				console.log('['+i+']: '+lines[i]);

			}
		}

		//PARSEREQUIRE
			//check if required files exist in fileList
			//parse and add missing files to fileList
			//PARSE
				//parse structures, functions or global variables
	}

	checkFile(file) {

	}

	parseRequire(data) {

	}

	parse(data) {

	}
}

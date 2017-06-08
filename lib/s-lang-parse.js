'use babel';

import * as slang_main from './s-lang-classes';
import * as hash from './murmurhash.js';

//removes comments that are not in a separate line
function removeComments(str){
	var lines = str.split(/\n/);
	for(let i in lines){
		lines[i] = lines[i].trim();
		var index = lines[i].indexOf('%');
		if (index > 0){
			lines[i] = lines[i].substring(0, index);
		}
	}
	return lines;
}
//separate keywords like "define", "typedef" and "variable" into newlines
function splitKeywords(lines){
	var returnStrs = [];
	for(let i in lines){
		if (lines[i][0] === '%'){
			returnStrs.push(lines[i]);
			continue;
		}

		var tmpStr = lines[i].replace(slang_main.strStringSplit, '$&\n').split(/\n/);
		// for (let u in tmpStr){
		// 	returnStrs.push(tmpStr[u]);
		// }
		returnStrs = returnStrs.concat(tmpStr);
	}
	return returnStrs;
}
//separate by symbols like "(){}[];"
function splitStrings(lines){
	var strings = [];
	for(let i in lines){
		if (lines[i][0] === '%'){
			strings.push(lines[i]);
			continue;
		}
		var index;
		while(true){
			lines[i] = lines[i].trim();
			index = lines[i].search(slang_main.charStringSplit);
			if (index == -1){
				var tmpStr = lines[i].trim();
				if (tmpStr.length > 0){
					strings.push(tmpStr);
				}
				break;
			}
			if (index == 0){
				var tmpStr = lines[i].substring(0, index+1).trim();
				if (tmpStr.length > 0){
					strings.push(tmpStr);
				}
				lines[i] = lines[i].substring(1);
				continue;
			}
			var tmpStr = lines[i].substring(0, index).trim();
			if (tmpStr.length > 0){
				strings.push(tmpStr);
			}
			lines[i] = lines[i].substring(index);
		}
	}
	return strings;
}
function fillArray(num, val){
	var arr = [num];
	for (var i=0; i<num; i++){
		arr[i] = val;
	}
	return arr;
}
//joins two filepath strings into one
function concatFileString(parent, child){
	child = child.replace(/^"+|"+$/gm, '');
	parent = parent.substring(0, parent.lastIndexOf('/'));

	// console.log("CHILD B4  "+child);
	// console.log("PARENT B4 "+parent);
	var parentLevel = 0;

	var tmpIndex = child.search(/\.\.\//);
	if (tmpIndex != -1){
		while(tmpIndex != -1){
			child = child.substring(tmpIndex+3);
			parent = parent.substring(0, parent.lastIndexOf('/'));
			parentLevel++;

			// console.log("CYCLE\nCHILD "+child+"\nPARENT "+parent);
			tmpIndex = child.search(/\.\.\//);
		}
	} else {
		tmpIndex = child.search(/\.\//);
		child = child.substring(tmpIndex+2);
	}
	// console.log("RESULT FILE\n"+parent+"/"+child);
	return parent+"/"+child;
}

export class slang_parser {
	static parseData(file, data) {
		var variables = []; //temporarily save variables here?

		//NOT NEEDED var depth = { round:0, curly:0, square:0 }; //depth of brackets () {} []
		var escape = false; //escape char \ inside string
		var string = false; //quote char " or ' signifying string

		var lines = data.toString();
		//HASHING NOT NEEDED
		// var dataHash = hash.murmurhash3_32_gc(lines, lines.length);
		// console.log("HASH "+dataHash);
		//remove comments, /%.*$/
		lines = removeComments(lines);
		//separate some keywords into new lines
		lines = splitKeywords(lines);
		//separating lines, /\(|\)|=|{|}|\[|\]|;/
		lines = splitStrings(lines);

		console.log("\nPARSING\nFILE\n"+file+"\n##------------------##");

		//for each string data entry
		for(var i=0; i<lines.length; i++){
			if (lines[i][0] === '%'){
				// console.log("COMMENT\n"+lines[i]);
				continue;
			}
			// console.log(lines[i]);

			// var keyWordCount = this.fillArray(slang_main.varKeywords.length, 0); //would have been used for race conditions
			//for each type
			for (var u=0; u<slang_main.varKeywords.length; u++){
				if (slang_main.varKeywords[u][1] === /\0/){
					continue;
				}
				var tmpIndex = lines[i].search(slang_main.varKeywords[u][1]);
				if (tmpIndex == -1){
					continue;
				}

				// console.log("FOUND\n"+slang_main.varKeywords[u][0]);

				var tmpln = [];
				var j = 0;
				var tmpIndex = lines[i+j].search(slang_main.varKeywords[u][6]);
				while(tmpIndex == -1){
					tmpln.push(lines[i+j]);
					j++;
					tmpIndex = lines[i+j].search(slang_main.varKeywords[u][6]);
				}
				tmpln.push(lines[i+j]);

				var bStartedName = false;
				var bStartedData = false;
				var bEndedName = false;
				var bEndedData = false;
				var foundName = ""; //2-3
				var foundData = ""; //4-5

				var debugStr="";

				if (slang_main.varKeywords[u][2] === '\0' && slang_main.varKeywords[u][3] === '\0'){
					bStartedName = true;
					bEndedName = true;
				}
				if (slang_main.varKeywords[u][4] === '\0' && slang_main.varKeywords[u][5] === '\0'){
					bStartedData = true;
					bEndedData = true;
				}

				j=0;
				for (let j in tmpln){
					if (!bStartedName){
						if (tmpln[j].search(slang_main.varKeywords[u][2]) != -1){
							bStartedName = true;
						}
					} else if (!bEndedName){
						var tmpIndex = tmpln[j].search(slang_main.varKeywords[u][3]);
						if (tmpIndex == -1){
							foundName += tmpln[j];
						} else {
							bEndedName = true;
						}
					}

					if (!bStartedData){
						if (tmpln[j].search(slang_main.varKeywords[u][4]) != -1){
							bStartedData = true;
						}
					} else if (!bEndedData){
						var tmpIndex = tmpln[j].search(slang_main.varKeywords[u][5]);
						if (tmpIndex == -1){
							foundData += tmpln[j];
						} else {
							bEndedData = true;
						}
					}

					debugStr += tmpln[j];
				}
				if (bStartedName && bEndedName && bStartedData && bEndedData){
					if (slang_main.varKeywords[u][0] === "Type_File"){
						foundName = concatFileString(file, foundName);
						variables.unshift(new slang_main.slang_variable(foundName, slang_main.varKeywords[u][0], foundData));
					} else if (slang_main.varKeywords[u][0] === "Type_Struc"){
						foundData = foundData.replace(/\s*,\s*/gm, ' ');
						variables.push(new slang_main.slang_variable(foundName, slang_main.varKeywords[u][0], foundData));
					} else {
						variables.push(new slang_main.slang_variable(foundName, slang_main.varKeywords[u][0], foundData));
					}

					// console.log(debugStr);
					// console.log("FOUND NAME\n"+foundName+"\nFOUND DATA\n"+foundData+"\nOF TYPE\n"+slang_main.varKeywords[u][0]);
				}
				i=i+tmpln.length-1;
			}
		}
		// console.log("\nPARSED\n##------------------##");

		return variables;
	}
}

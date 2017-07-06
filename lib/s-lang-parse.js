'use babel';

import * as slang_main from './s-lang-classes';

//separate string literals and comments
function splitLiteralsComments(str){
	var lines = str.split('\n');
	var strings = [];
	var stringLit = [];
	var bStr = false;
	var bCom = false;

	for (let i in lines){
		lines[i] = lines[i].trim();
		if (lines[i].length == 0){
			continue;
		}

		if (!bStr && lines[i][0] === "%"){
			strings.push(lines[i]);
			continue;
		}

		var tmpLns = lines[i].replace(/\\\\|\\\"/gm, "").replace(/\"|%/gm, "\n$&\n").split('\n');
		for (let u in tmpLns){
			tmpLns[u] = tmpLns[u].trim();
			if (tmpLns[u].length == 0){
				continue;
			}

			if (!bCom && tmpLns[u] === "\""){
				bStr = !bStr;
				if (bStr){
					strings.push(tmpLns[u]);
				} else {
					strings[strings.length-1] += tmpLns[u];
				}
				continue;
			}
			if (!bCom && !bStr && tmpLns[u] === "%"){
				bCom = true;
				strings.push(tmpLns[u]);
				continue;
			}

			if (bCom){
				strings[strings.length-1] += tmpLns[u];
				continue;
			} else if (bStr){
				strings[strings.length-1] += tmpLns[u];
			} else {
				strings.push(tmpLns[u]);
			}
		}
		bStr = false;
		bCom = false;
	}
	return strings;
}
//separate by symbols like "(){}[];"
function splitStrings(lines){
	var index;
	var strings = [];
	var tmpStr;
	//splits code on special chars
	for(let i in lines){
		if (lines[i][0] === slang_main.charComment || lines[i][0] === "\""){
			strings.push(lines[i]);
			continue;
		}

		while(true){
			lines[i] = lines[i].trim();
			index = lines[i].search(slang_main.charStringSplit);
			if (index == -1){
				if (lines[i].length > 0){
					strings.push(lines[i]);
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
	var arr = [];
	for (var i=0; i<num; i++){
		arr[i] = val;
	}
	return arr;
}
//joins two filepath strings into one
function concatFileString(parent, child){
	child = child.replace(/^"+|"+$/gm, '');
	parent = parent.substring(0, parent.lastIndexOf('/'));

	var tmpIndex = child.search(/\.\.\//);
	if (tmpIndex != -1){
		while(tmpIndex != -1){
			child = child.substring(tmpIndex+3);
			parent = parent.substring(0, parent.lastIndexOf('/'));

			tmpIndex = child.search(/\.\.\//);
		}
	} else {
		tmpIndex = child.search(/\.\//);
		child = child.substring(tmpIndex+2);
	}
	return parent+"/"+child;
}

export class slang_parser {
	static parseData(file, data) {
		var variables = []; //temporarily save variables here
		var lines = data.toString();

		var tabLevel = 0;

		//separate string literals and comments
		lines = splitLiteralsComments(lines);
		//separating lines, /\(|\)|=|{|}|\[|\]|;|\*|-|\+|\//
		lines = splitStrings(lines);

		console.log("\nPARSING\nFILE\n"+file+"\n##------------------##");

		var comments = [];
		//for each separated string data entry
		for(var i=0; i<lines.length; i++){


			if (lines[i][0] === slang_main.charComment){
				comments += " "+lines[i];
				continue;
			}
			if (lines[i][0] === "\""){
				continue;
			}

			if (lines[i] == "{"){
				tabLevel++;
			} else if (lines[i] == "}"){
				tabLevel--;
			}
			// console.log(lines[i]+" "+tabLevel);

			for (var u=0; u<slang_main.varKeywords.length; u++){
				if (slang_main.varKeywords[u][1] === /\0/){
					continue;
				}
				var tmpIndex = lines[i].search(slang_main.varKeywords[u][1]);
				if (tmpIndex == -1){
					continue;
				}

				var tmpln = [];
				var j = 0;
				tmpIndex = -1;
				while(tmpIndex == -1 && (j+i) < lines.length-1){
					tmpln.push(lines[i+j]);
					tmpIndex = lines[i+j].search(slang_main.varKeywords[u][6]);
					j++;

					if (lines[i+j] == "{"){
						tabLevel++;
					} else if (lines[i+j] == "}"){
						tabLevel--;
					}
					// console.log(lines[i+j]+" "+tabLevel);
				}

				var bStartedName = false;
				var bStartedData = false;
				var bEndedName = false;
				var bEndedData = false;
				var foundName = ""; //2-3
				var foundData = ""; //4-5

				if (slang_main.varKeywords[u][4] === '\0' && slang_main.varKeywords[u][5] === '\0'){
					bStartedData = true;
					bEndedData = true;
				}

				console.log("j=0");
				j=0;
				for (let j in tmpln){
					var bCheck = true;
					if (tmpln[j][0] === "\""){
						bCheck = false;
					}
					if (bCheck && !bStartedName){
						if (tmpln[j].search(slang_main.varKeywords[u][2]) != -1){
							bStartedName = true;
						}
					} else if (!bEndedName){
						var tmpIndex = tmpln[j].search(slang_main.varKeywords[u][3]);
						if (tmpIndex == -1 || !bCheck){
							foundName += tmpln[j];
						} else {
							bEndedName = true;
						}
					}

					if (bCheck && !bStartedData){
						if (tmpln[j].search(slang_main.varKeywords[u][4]) != -1){
							bStartedData = true;
						}
					} else if (!bEndedData){
						var tmpIndex = tmpln[j].search(slang_main.varKeywords[u][5]);
						if (tmpIndex == -1 || !bCheck){
							foundData += tmpln[j];
						} else {
							bEndedData = true;
						}
					}
				}
				if (slang_main.varKeywords[u][0] === "Type_Basic"){
					bStartedData = true;
					bEndedData = true;
				}
				if (bStartedName && bEndedName && bStartedData && bEndedData){
					console.log(slang_main.varKeywords[u][0]+" "+foundName+" "+foundData);

					if (slang_main.varKeywords[u][0] === "Type_File"){
						foundData = concatFileString(file, foundName);
						variables.unshift(new slang_main.slang_variable(foundData, slang_main.varKeywords[u][0], foundName));
						break;
					}

					if (slang_main.varKeywords[u][0] === "Type_Struc"){
						foundData = foundData.replace(/\s*,\s*/gm, ', ');
						var tmpSplit = foundData.trim().split(/,\s*/gm);
						variables.push(new slang_main.slang_variable(foundName, slang_main.varKeywords[u][0], "{"+foundData+"} "+comments));
						for (var j in tmpSplit){
							if (tmpSplit[j].length > 0){
								variables.push(new slang_main.slang_variable(foundName+"."+tmpSplit[j], 'property', "struct "+foundName));
							}
						}
						break;
					}

					if (slang_main.varKeywords[u][0] === "Type_Ref") {
						foundData = foundData.replace(/,\s*/gm, ", ");
						variables.push(new slang_main.slang_variable(foundName, slang_main.varKeywords[u][0], "("+foundData+") "+comments));
						break;
					}

					variables.push(new slang_main.slang_variable(foundName, slang_main.varKeywords[u][0], "= "+foundData+"; "+comments));
				}
				i=i+tmpln.length-1;
			}
			comments = [];
		}
		return variables;
	}
}

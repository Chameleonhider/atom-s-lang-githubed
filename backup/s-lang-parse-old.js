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

//parses Type_Basic variables, which can be a) multiple per line b) anonymous structures
//input array of found strings
//returns array of variables (even if there's only one)
// ModuleData,=,struct,{,
// File_Requirements,=,[,Selection_Icon,,,Clip_BG,,,Clip_BG_Reloading,,,Scope_Pic,,,Bullet_Icon,,,Item_Model,,,Bullet_Model,,,ShotSound,],,,
// Defined_Items,=,{,Default_BARifleType,},}
function parseVariableData(lines, comments){
	console.log("Type_Basic\n"+lines+"\n"+comments);
	var struc = "Type_Struc";
	var basic = "Type_Basic";

	var
	var curlyLevel = 0;
	var squareLevel = 0;
	var variables = []; //returned array of variables, inlcudes structs and their fields

	var foundName = "";
	var foundData = undefined;

	var ownerStack = []; //saves owner {name}
	// NOTE use stack for owner name:
	// NOTE [struct0, struct1, struct2] would result in e.g. struct0.struct1.struct2.fields_of_struct2
	// newly found variables would be instantly added to "variables" array which is later returned

	// variable name, name1, name2;
	// variable name = value;
	// variable name = value, name1 = value1, name2;
	// variable name = struct { property, property=value, property=[array, array], property=struct{structure} };
	for (let i in lines){
		if (lines[i][0] === slang_main.charComment){
			comments += " "+lines[i];
			continue;
		} if (lines[i][0] === "\""){
			if (foundName !== "" && foundData !== undefined && squareLevel === 0){
				foundData += lines[i];
			}
			continue;
		} if (lines[i] === "{"){
			curlyLevel++;
			continue;
		} if (lines[i] === "}"){
			curlyLevel--;
			continue;
		} if (lines[i] === "["){
			squareLevel++;
			continue;
		} if (lines[i] === "]"){
			squareLevel--;
			continue;
		} if (squareLevel !== 0){
			continue;
		}

		//TODO code here
		if (foundName === ""){
			if (lines[i] === ","){
				//nothing
			} else {
				foundName = lines[i];
			}
		}
		if (foundName !== ""){
			if (lines[i] === ","){
				variables.push(new slang_main.slang_variable(foundName, struc, foundData));

				foundName = "";
				foundData = undefined;
			}
			if (lines[i] === "="){
				foundData = "";
			}
		}
	}
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

		var bStartedName = false;
		var bStartedData = false;
		var bEndedName = false;
		var bEndedData = false;
		var foundName = ""; //2-3
		var foundData = ""; //4-5
		var foundArray = [];
		var keyW = -1;

		var comments = "";
		//for each separated string data entry
		for(var i=0; i<lines.length; i++){
			//count indentation no matter what
			if (lines[i] === "{"){
				tabLevel++;
			} else if (lines[i] === "}"){
				tabLevel--;
			}

			if (keyW == -1){
				bStartedName = false;
				bStartedData = false;
				bEndedName = false;
				bEndedData = false;
				foundName = "";
				foundData = "";
				foundArray = [];
				//ignore comments and string literals
				if (lines[i][0] === slang_main.charComment){
					comments += " "+lines[i];
					continue;
				}
				if (lines[i][0] === "\""){
					continue;
				}

				if (tabLevel == 0){
					for (var u=0; u<slang_main.varKeywords.length; u++){
						if (slang_main.varKeywords[u][1] === /\0/){
							continue;
						}
						var tmpIndex = lines[i].search(slang_main.varKeywords[u][1]);
						if (tmpIndex != -1){
							keyW = u;
							break;
						}
					}
				}
				if (keyW == -1){
					comments = "";
					continue;
				}
			}
			var bCheck = true;
			if (lines[i][0] === "\""){
				bCheck = false;
			}
			if (!bCheck || lines[i].search(slang_main.varKeywords[keyW][6]) == -1){
				if (bCheck && !bStartedName){
					if (lines[i].search(slang_main.varKeywords[keyW][2]) != -1){
						bStartedName = true;
					}
				} else if (!bEndedName){
					var tmpIndex = lines[i].search(slang_main.varKeywords[keyW][3]);
					if (tmpIndex == -1 || !bCheck){
						if (slang_main.varKeywords[keyW][0] === "Type_Basic"){
							foundArray.push(lines[i]);
						} else {
							foundName += lines[i];
						}
					} else {
						bEndedName = true;
					}
				}

				if (bCheck && !bStartedData){
					if (lines[i].search(slang_main.varKeywords[keyW][4]) != -1){
						bStartedData = true;
					}
				} else if (!bEndedData){
					var tmpIndex = lines[i].search(slang_main.varKeywords[keyW][5]);
					if (tmpIndex == -1 || !bCheck){
						foundData += lines[i];
					} else {
						bEndedData = true;
					}
				}
			} else {
				bEndedName = true;
				bEndedData = true;

				if ((slang_main.varKeywords[keyW][4] === '\0' && slang_main.varKeywords[keyW][5] === '\0')
				||   slang_main.varKeywords[keyW][0] === "Type_Basic"){
					bStartedData = true;
					bEndedData = true;
				}

				if (bStartedName && bEndedName && bStartedData && bEndedData){
					console.log(slang_main.varKeywords[keyW][0]+"\n"+foundName+" "+foundData);

					if (slang_main.varKeywords[keyW][0] === "Type_File"){
						foundData = concatFileString(file, foundName);
						variables.unshift(new slang_main.slang_variable(foundData, slang_main.varKeywords[keyW][0], foundName));
					}

					else if (slang_main.varKeywords[keyW][0] === "Type_Struc"){
						foundData = foundData.replace(/\s*,\s*/gm, ', ');
						var tmpSplit = foundData.trim().split(/,\s*/gm);
						variables.push(new slang_main.slang_variable(foundName, slang_main.varKeywords[keyW][0], "{"+foundData+"} "+comments));
						for (var j in tmpSplit){
							if (tmpSplit[j].length > 0){
								variables.push(new slang_main.slang_variable(foundName+"."+tmpSplit[j], 'property', "struct "+foundName));
							}
						}
					}

					else if (slang_main.varKeywords[keyW][0] === "Type_Ref") {
						foundData = foundData.replace(/,\s*/gm, ", ");
						variables.push(new slang_main.slang_variable(foundName, slang_main.varKeywords[keyW][0], "("+foundData+") "+comments));
					}

					else if (slang_main.varKeywords[keyW][0] === "Type_Basic"){
						var tmpVar = parseVariableData(foundArray, comments);
						for (let u in tmpVar){
							variables.push(tmpVar[u]);
						}
					}

					else {
						variables.push(new slang_main.slang_variable(foundName, slang_main.varKeywords[keyW][0], "= "+foundData+"; "+comments));
					}
				}
				keyW = -1;
			}
		}
		return variables;
	}
}

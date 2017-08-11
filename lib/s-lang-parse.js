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
	// console.log("Data:\n"+lines+"\nComments:\n"+comments);
	comments = " "+comments;
	var struc = "Type_Struc";
	var basic = "Type_Basic";

	/*
0 searching for "name"
<<< if found "," or ";" at 1 or 3 or 7
>>> to 1 when found "name"

1 searching for "," or ";" or "="
<<< if found "name" at 0
>>> to 0 if found "," or ";" (add "name" to variables)
>>> to 2 if found "="

2 searching for "data" or "struct"
<<< if found "=" at 1
>>> to 3 if found "data"
>>> to 4 if found "struct"

3 searching for "," or ";"
<<< if found "data" at 2
<<< if found "}" at 5 or 6 or 8 and curlyLevel === 0
>>> to 0 if found "," or ";" (add "name" and "data" to variables)

4 searching for "{"
<<< if found "struct" at 2 or 7
>>> to 5 if found "{"
(add "name" as struct to variables, add name to stack)

5 searching for "}" or "name"
<<< if found "{" at 4
>>> to 3 if found "}" and curlyLevel === 0
>>> to 8 if found "}"
>>> to 6 if found "name"

6 searching for "}" or "," or "="
<<< if found "name" at 5
>>> to 3 if found "}" and curlyLevel === 0 (add "name" to variables)
>>> to 8 if found "}"
>>> to 5 if found "," (add "name" to variables)
>>> to 7 if found "="

7 searching for "struct" or "data"
<<< if found "=" at 6
>>> to 4 if found "struct"
>>> to 8 if found "data"

8 searching for "}" or ","
<<< if found "data" at 7; if found "}" at 5 or 6 search until curly level is zero
>>> to 3 if found "}" and curlyLevel === 0 (add "name" and "data" to variables)
>>> to 5 if found "," (add "name" and "data" to variables)
	*/
	var state = 0;
	var curlyLevel = 0;
	var squareLevel = 0;
	var variables = []; //returned array of variables, inlcudes both structs and their fields

	var foundName = "";
	var foundData = "";

	var ownerStack = []; //saves owner name

	for (let i in lines){
		if (lines[i] === "["){
			squareLevel++;
			continue;
		} else if (lines[i] === "]"){
			squareLevel--;
			continue;
		}
		if (squareLevel > 0){
			switch (state){
				case 2:
					foundData = lines[i];
					state = 3;
					break;
				case 7:
					foundData = lines[i];
					state = 8;
					break;
				case 3:
				case 8:
					foundData += lines[i];
					if (lines[i] === ","){
						foundData += " ";
					}
					break;
				default:
					break;
			}
			continue;
		}
		var oldState = state;
		switch(state){
			case 0:
			// 0 searching for "name"
			// <<< if found "," or ";" at 1 or 3 or 7
			// >>> to 1 when found "name"
				foundName = lines[i];
				state = 1;
				break;

			case 1:
			// 1 searching for "," or ";" or "="
			// <<< if found "name" at 0
			// >>> to 0 if found "," or ";" (add "name" to variables)
			// >>> to 2 if found "="
				if (lines[i] === "," || lines[i] === ";"){
					if (foundName !== ""){
						variables.push(new slang_main.slang_variable(foundName, basic, comments));
						foundName = "";
						foundData = "";
					}

					state = 0;
				} else if (lines[i] === "="){
					state = 2;
				}
				break;

			case 2:
			// 2 searching for "data" or "struct"
			// <<< if found "=" at 1
			// >>> to 3 if found "data"
			// >>> to 4 if found "struct"
				if (lines[i] === "struct"){
					state = 4;
				} else if (lines[i] === "{"){
					curlyLevel++;

					if (ownerStack.length > 0){
						ownerStack.push(ownerStack[ownerStack.length-1]+"."+foundName);
					} else {
						ownerStack.push(foundName);
					}
					if (foundName !== ""){
						variables.push(new slang_main.slang_variable(ownerStack[ownerStack.length-1], struc, comments));
						foundName = "";
						foundData = "";
					}

					state = 5;
				} else {
					foundData += lines[i];

					state = 3;
				}
				break;

			case 3:
			// 3 searching for "," or ";"
			// <<< if found "data" at 2
			// <<< if found "}" at 5 or 6 or 8 and curlyLevel === 0
			// >>> to 0 if found "," or ";" (add "name" and "data" to variables)
				if (lines[i] === "," || lines[i] === ";"){
					if (foundName !== ""){
						variables.push(new slang_main.slang_variable(foundName, basic, foundData+comments));
						foundName = "";
						foundData = "";
					}

					state = 0;
				} else {
					foundData += lines[i];
				}
				break;

			case 4:
			// 4 searching for "{"
			// <<< if found "struct" at 2 or 7
			// >>> to 5 if found "{"
			// >>> to 3 if not found "{" and curlyLevel === 0
			// >>> to 8 if not found "{"
			// (add "name" as struct to variables, add name to stack)
				if (lines[i] === "{"){
					curlyLevel++;

					if (ownerStack.length > 0){
						ownerStack.push(ownerStack[ownerStack.length-1]+"."+foundName);
					} else {
						ownerStack.push(foundName);
					}
					if (foundName !== ""){
						variables.push(new slang_main.slang_variable(ownerStack[ownerStack.length-1], struc, comments));
						foundName = "";
						foundData = "";
					}

					state = 5;
				} else if (curlyLevel <= 0){
					state = 3;
				} else {
					state = 8;
				}
				break;

			case 5:
			// 5 searching for "}" or "name"
			// <<< if found "{" at 4
			// >>> to 3 if found "}" and curlyLevel === 0
			// >>> to 8 if found "}"
			// >>> to 6 if found "name"
				if (lines[i] === "}"){
					curlyLevel--;
					ownerStack.pop();
					if (curlyLevel <= 0){
						state = 3;
					} else {
						state = 8;
					}
				} else {
					foundName = lines[i];
					state = 6;
				}
				break;

			case 6:
			// 6 searching for "}" or "," or "="
			// <<< if found "name" at 5
			// >>> to 5 if found "," (add "name" to variables)
			// >>> to 3 if found "}" and curlyLevel === 0 (add "name" to variables)
			// >>> to 8 if found "}" (add "name" to variables)
			// >>> to 7 if found "="
				if (lines[i] === ","){
					if (foundName !== ""){
						variables.push(new slang_main.slang_variable(ownerStack[ownerStack.length-1]+"."+foundName, basic, comments));
						foundName = "";
						foundData = "";
					}
					state = 5;
				} else if (lines[i] === "}"){
					curlyLevel--;
					if (foundName !== ""){
						variables.push(new slang_main.slang_variable(ownerStack[ownerStack.length-1]+"."+foundName, basic, comments));
						foundName = "";
						foundData = "";
					}
					ownerStack.pop();
					if (curlyLevel <= 0){
						state = 3;
					} else {
						state = 8;
					}
				} else if (lines[i] === "="){
					state = 7;
				}
				break;

			case 7:
			// 7 searching for "struct" or "data"
			// <<< if found "=" at 6
			// >>> to 4 if found "struct"
			// >>> to 8 if found "data"
				if (lines[i] === "struct"){
					state = 4;
				} else if (lines[i] === "{"){
					curlyLevel++;

					if (ownerStack.length > 0){
						ownerStack.push(ownerStack[ownerStack.length-1]+"."+foundName);
					} else {
						ownerStack.push(foundName);
					}
					variables.push(new slang_main.slang_variable(ownerStack[ownerStack.length-1], struc, comments));
					foundName = "";
					foundData = "";

					state = 5;
				} else {
					foundData += lines[i];

					state = 8;
				}
				break;

			case 8:
			// 8 searching for "}" or ","
			// <<< if found "data" at 7; if found "}" at 5 or 6 search until curly level is zero
			// >>> to 3 if found "}" and curlyLevel === 0 (add "name" and "data" to variables)
			// >>> to 8 if found "}"
			// >>> to 5 if found "," (add "name" and "data" to variables)
				if (lines[i] === "}"){
					curlyLevel--;
					if (foundName !== ""){
						variables.push(new slang_main.slang_variable(ownerStack[ownerStack.length-1]+"."+foundName, basic, foundData+comments));
						foundName = "";
						foundData = "";
					}
					ownerStack.pop();
					if (curlyLevel <= 0){
						state = 3;
					} else {
						state = 8;
					}
				} else if (lines[i] === ","){
					if (foundName !== ""){
						variables.push(new slang_main.slang_variable(ownerStack[ownerStack.length-1]+"."+foundName, basic, foundData+comments));
						foundName = "";
						foundData = "";
					}
					state = 5;
				}
				break;

			default:
				console.error("ERR: unknown state "+state);
				break;
		}
		// console.log("lines["+i+"]: "+lines[i]+"\noldstate: "+oldState+"\nstate: "+state+"\ncurlyLevel: "+curlyLevel);
	}
	return variables;
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

		// console.log("\nPARSING\nFILE\n"+file);

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
					//console.log(slang_main.varKeywords[keyW][0]+"\n"+foundName+" "+foundData);

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
						foundArray.push(";");
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

'use babel';

import * as slang_parse from './s-lang-parse';
const fs = require("fs");

export function slang_variable (name, type, data) {
	this.name = name; 	//string
	this.type = type;	//varType
	this.data = data;	//array / struct / function information
	/*four cases:
	Variable
		name string
		type Type_Basic
		data Type_Subtype

	Structure
		name string
		type Type_Struc
		data Variable_List

	Array
		name string
		type Type_Array
		data Type_Of_Items

	Function
		name string
		type Type_Ref
		data parameters

	File
		name filepath
		type Type_File
		data variables[]
	*/
};

export function file(name, date, variables){
	//file full path, used for reading file etc.
	this.name = name;
	//file date, used for checking file changes
	this.date = date;
	//list of variables/structs/functions found, including "require"s
	this.variables = variables;
	//private list of entries saved for performance purposes
	this.privateEntryList = undefined;
	//refreshes entry list
	this.refreshEntries = function(){
		this.privateEntryList = [];
		for (let i in this.variables){
			var variable = this.variables[i];
			if (variable.type != "Type_File"){
				var typeEntry = variable.type;
				if (variable.type == "Type_Basic"){
					typeEntry = 'variable';
				} else if (variable.type == "Type_Ref"){
					typeEntry = 'function';
				} else if (variable.type == "Type_Struc"){
					typeEntry = 'type';
				}
				var tmpEntry = {
					text: variable.name,
					type: typeEntry,
					description: variable.data
				}
				//same as tmpFile.privateEntryList.push(tmpEntry);
				this.privateEntryList.push(tmpEntry);
			}
		}
	}
};

//static private variable
// var counter;

export function main(){
	this.files = {};
	this.reparseFileList = [];

	//checks if file needs parsing
	//returns false if file needs to be reparsed
	this.checkParse = function(filePath){
		try{
			var fsStats = fs.statSync(filePath);
		} catch (err){
			console.log(err);
			return true;
		}

		if (this.files[filePath] == undefined){
			return false;
		}
		return this.files[filePath].date == fsStats.mtime.getTime();
	};
	//parse the secondary file list (which has been updated @addFile())
	this.reparseFiles = function(){
		while(this.reparseFileList.length > 0){
			var tmpReparseFiles = this.reparseFileList;
			this.reparseFileList = [];
			for (let i in tmpReparseFiles){
				if (!this.checkParse(tmpReparseFiles[i])){
					console.log("add file "+tmpReparseFiles[i]);
					this.addFile(tmpReparseFiles[i]);
				}
			}
		}
	}
	//parses and adds file to array, updates secondary array for "require"d files
	this.addFile = function(filePath){
		if (!this.checkParse(filePath)){
			var parsedFile = this.parse(filePath);
			if (parsedFile != undefined){
				this.files[filePath] = parsedFile;
				//check for new files to be parsed
				//if variable list exists
				if (this.files[filePath].variables != undefined){
					//for each variable
					var variables = this.files[filePath].variables;
					for (let i in variables){
						//if variable is file
						if (variables[i].type == "Type_File"){
							//check if file needs to be parsed
							if (!this.checkParse(variables[i].name)){
								//add file to be parsed
								this.reparseFileList.push(variables[i].name);
							}
						}
					}
				}
			} else {
				delete this.file[parsedFile];
			}
		}
	};
	//parses file from given name
	this.parse = function(filePath){
		try{
			var fsStats = fs.statSync(filePath);
			var date = fsStats.mtime.getTime();
			var variables;

			// Open file sync/async https://discuss.atom.io/t/basic-file-read/38228
			var data;
			data = fs.readFileSync(filePath);
			variables = slang_parse.slang_parser.parseData(filePath, data);
			return new file(filePath, date, variables);
		} catch (err){
			console.log(err);
			return undefined;
		}
	};
	//updates each file and entry lists of each file if needed
	this.updateFileEntries = function(){
		for (var i in this.files){
			if (!this.checkParse(this.files[i].name)){
				this.addFile(this.files[i].name);
			}
		}
		this.reparseFiles();

		for (var i in this.files){
			var tmpFile = this.files[i];
			if (tmpFile.privateEntryList == undefined){
				tmpFile.refreshEntries();
			}
		}
	};

	//returns one exact variable reachable from given file
	this.getEntry = function(filePath, keyword){
		keyword = keyword.replace(/\?/gm, "");
		//update entry lists of each file
		this.updateFileEntries();

		//include "require"d files once
		var includedFiles = {}; //use for saving all files to be included
		var filesToInclude = []; //temporarily use for going trough "require"s
		includedFiles[filePath] = filePath;
		filesToInclude.push(filePath);
		var n = 2048;
		while(filesToInclude.length > 0 && n > 0){
			n--;

			var tmpFilesToInclude = filesToInclude;
			filesToInclude = [];

			for (let i in tmpFilesToInclude){
				var tmpFile = this.files[tmpFilesToInclude[i]];
				if (tmpFile == undefined){
					continue;
				}

				for (let u in tmpFile.variables){
					//check if variable is of file type
					//check if it hasn't been included
					if (tmpFile.variables[i].type === "Type_File"
					&&	includedFiles[tmpFile.variables[i].name] == undefined)
					{
						//include it then
						includedFiles[tmpFile.variables[i].name] = tmpFile.variables[i].name;
						filesToInclude.push(tmpFile.variables[i].name);
					} else if (tmpFile.variables[i].type !== "Type_File"){
						break;
					}
				}
			}
		}

		//add entry lists from each file
		var entryList = [];
		for (var i in includedFiles){
			var tmpFile = this.files[includedFiles[i]];
			if (tmpFile == undefined){
				continue;
			}
			for (let u in tmpFile.privateEntryList){
				//file's entry list is valid, use it
				if (tmpFile.privateEntryList[u].text.endsWith(keyword)){
					var tmpEntry = tmpFile.privateEntryList[u];
					tmpEntry.replacementPrefix = "?";
					entryList.push(tmpEntry);
				}
			}
		}
		console.log(entryList);
		return entryList;
	}
	//returns all variables reachable from given file
	this.getEntries = function(filePath, keyword){
		keyword = keyword.replace(/\\|\?/gm, "");
		var regexp = new RegExp(keyword, "i");
		//update entry lists of each file
		this.updateFileEntries();

		//include "require"d files once
		var includedFiles = {}; //use for saving all files to be included
		var filesToInclude = []; //temporarily use for going trough "require"s
		includedFiles[filePath] = filePath;
		filesToInclude.push(filePath);
		var n = 2048;
		while(filesToInclude.length > 0 && n > 0){
			n--;

			var tmpFilesToInclude = filesToInclude;
			filesToInclude = [];

			for (let i in tmpFilesToInclude){
				var tmpFile = this.files[tmpFilesToInclude[i]];
				if (tmpFile == undefined){
					continue;
				}

				for (let u in tmpFile.variables){
					//check if variable is of file type
					//check if it hasn't been included
					if (tmpFile.variables[i].type === "Type_File"
					&&	includedFiles[tmpFile.variables[i].name] == undefined)
					{
						//include it then
						includedFiles[tmpFile.variables[i].name] = tmpFile.variables[i].name;
						filesToInclude.push(tmpFile.variables[i].name);
					} else if (tmpFile.variables[i].type !== "Type_File"){
						break;
					}
				}
			}
		}

		//add entry lists from each file
		var entryList = [];
		for (var i in includedFiles){
			var tmpFile = this.files[includedFiles[i]];
			if (tmpFile == undefined){
				continue;
			}
			for (let u in tmpFile.privateEntryList){
				//file's entry list is valid, use it
				if (tmpFile.privateEntryList[u].text.search(regexp) !== -1){
					var tmpEntry = tmpFile.privateEntryList[u];
					tmpEntry.replacementPrefix = keyword;
					entryList.push(tmpEntry);
				}
			}
		}
		console.log(entryList);
		return entryList;
	}
}

//chars that signify a comment
export var charComment = '%';
//chars that will split the input
export var charStringSplit = new RegExp(/\(|\)|=|{|}|\[|\]|;|\*|-|\+|\/|\s|,/, 'm');
export var strStringSplit = new RegExp(/(define\s)|(typedef\s)|(variable\s)/, 'gm');
//chars not allowed inside a variable name
export var charForbidden = new RegExp(/^[0-9]|`|!|@|#|\$|%|\^|&|\*|-|\+|=|\||\\|:|'|"|,|\.|<|>|\//, 'gm');

export var varKeywords = [
//0: var_type
//1: essential first regexp match
//2-3: name field surrounded by regexp
//4-5: data field surrounded by regexp
//6: limiter
	//Type_Name		regexp			name0		name1		data0		data1		limiter
	["Type_None",	/\0/,			/\0/, 		/\0/, 		'\0', 		'\0',		/;/],//Type_None, should not find
	// ["Type_Array",	/\0/,		/\0/, 		/=/, 		/=/, 		/\[/,		/;/],//Type_Array
	// ["Type_Basic",	/variable/,	/variable/, /;/,		/\0/,		/\0/,		/;/],//Type_Basic, uninitialised
	["Type_Basic",	/^variable/,	/variable/, /;/,		'\0',		'\0',		/;/],//Type_Basic, initialised
	["Type_Ref",	/^define/, 		/define/,	/\(/,		/\(/,		/\)/,		/\)/],//Type_Ref
	["Type_Struc",	/^typedef/,		/}/,		/;/,		/{/, 		/}/,		/;/],//Type_Struc
	["Type_File",	/^require/,		/\(/,		/\)/,		'\0',		'\0',		/;/]//Type_File
];
export var varTypeToNum = {
	//only 1-7 should be used
	Type_None		: 0, //unused
	Type_Array		: 1, //unused
	Type_Basic		: 2,
	Type_Ref		: 3,
	Type_RefStruc	: 4, //unused	//function that definitely belongs to struct
	Type_Struc		: 5,
	Type_File		: 6	 //included file
};
export var varNumToType = [
	//for easier user output
	//only 1-7 should be used
	"Type_None",		// 0 --unused
	"Type_Array",		// 1 array --unused
	"Type_Basic",		// 2 basic variable
	"Type_Ref",			// 3 function
	"Type_RefStruc",	// 4 function that definitely belongs to struct --unused
	"Type_Struc",		// 5 structure
	"Type_File",		// 6 included file
];

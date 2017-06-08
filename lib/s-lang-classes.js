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
};

//static private variable
// var counter;

export function main(){
	this.files = {};
	this.reparseFileList = [];

	//checks if file needs parsing
	//returns true if file is up-to-date
	this.checkParse = function(filePath){
		if (this.files[filePath] == undefined){
			return false;
		}

		var fsStats = fs.statSync(filePath);
		return this.files[filePath].date == fsStats.mtime.getTime();
	};
	//reparse the whole file list
	this.reparseFiles = function(){
		var n=10;
		while(this.reparseFileList.length > 0 && n > 0){
			n=n-1;
			var tmpReparseFiles = this.reparseFileList;
			this.reparseFileList = [];
			for (let i in tmpReparseFiles){
				this.addFile(tmpReparseFiles[i]);
			}
		}

		for (var v in this.files){
			var log = "FILE\n"+this.files[v].name+"\nDATE "+this.files[v].date;
			if (this.files[v].variables != undefined){
				log += "\nVARCOUNT "+this.files[v].variables.length;
			}
			console.log(log);
		}
	}

	//adds file to array
	//returns if all files should be checked for reparsing
	//when reparsing use "addFile"
	this.addFile = function(filePath){
		if (!this.checkParse(filePath)){
			this.files[filePath] = this.parse(filePath); //new file(filePath, -1, undefined)
		}

		//check for new files to be parsed
		//if variable list exists
		if (this.files[filePath] != undefined && this.files[filePath].variables != undefined){
			//for each variable
			var variables = this.files[filePath].variables;
			for (let i in variables){
				//if variable is file
				if (variables[i].type == "Type_File"){
					//check if file needs to be parsed
					if (!this.checkParse(variables[i].name)){
						//add file to be parsed
						console.log("Adding file "+variables[i].name+" to be parsed");
						this.reparseFileList.push(variables[i].name);
						console.log(this.reparseFileList);
					}
				}
			}
		}
	};
	//parses file from given name
	this.parse = function(filePath){
		var fsStats = fs.statSync(filePath);
		var date = fsStats.mtime.getTime();
		var variables;

		// Open file async https://discuss.atom.io/t/basic-file-read/38228
		var data;
		data = fs.readFileSync(filePath);
		variables = slang_parse.slang_parser.parseData(filePath, data);
		return new file(filePath, date, variables);//return variable list or smth
	};
}

//chars that signify a comment
export var charComment = '%';
//chars that will split the input
export var charStringSplit = new RegExp(/\(|\)|=|{|}|\[|\]|;/, 'gm');
export var strStringSplit = new RegExp(/(define\s)|(typedef\s)|(variable\s)/, 'gm');
//chars not allowed inside a variable name
export var varNameTabooChars = new RegExp(/^[0-9]|`|!|@|#|\$|%|\^|&|\*|-|\+|=|\||\\|:|'|"|,|\.|<|>|\/|\?/, 'gm');
export var varKeywords = [
//0: var_type
//1: essential first regexp match
//2-3: name field surrounded by regexp
//4-5: data field surrounded by regexp
//6: limiter

//since "data" can be found earlier than "name",
//cycle text from first regexp match till limiter
//for each of the "name" and "data" fields

	//Type_Name		regexp			name0		name1		data0		data1		limiter
	["Type_None",	/\0/,			/\0/, 		/\0/, 		/\0/, 		/\0/,		/;/],//Type_None, should not find
	// ["Type_Array",	/\0/,		/\0/, 		/=/, 		/=/, 		/\[/,		/;/],//Type_Array
	// ["Type_Basic",	/variable/,	/variable/, /;/,		/\0/,		/\0/,		/;/],//Type_Basic, uninitialised
	["Type_Basic",	/^variable/,	/variable/, /=/,		/=/,		/;/,		/;/],//Type_Basic, initialised
	["Type_Ref",	/^define/, 		/define/,	/\(/,		/\(/,		/\)/,		/\)/],//Type_Ref
	["Type_Struc",	/^typedef/,		/}/,		/;/,		/{/, 		/}/,		/;/],//Type_Struc
	["Type_File",	/^require/,		/\(/,		/\)/,		'\0',		'\0',		/;/]//Type_File
];
// export var varKeywords = [
// 	[""],								//Type_None
// 	["[", "]"],							//Type_Array
// 	["variable"],						//Type_Basic
// 	["define", "(", ")"],				//Type_Ref
// 	["define", "(", "this", ")"],		//Type_RefStruc
// 	["typedef", "struct", "{", "}"],	//Type_Struc
// 	["require", "(", "\"", "\"", ")"]	//Type_File
// ];
export var varTypeToNum = {
	//only 1-7 should be used
	Type_None		: 0,
	Type_Array		: 1,
	Type_Basic		: 2,
	Type_Ref		: 3,
	Type_RefStruc	: 4,	//function that definitely belongs to struct
	Type_Struc		: 5,
	Type_File		: 6		//included file
};
export var varNumToType = [
	//for easier user output
	//only 1-7 should be used
	"Type_None",		// 0
	"Type_Array",		// 1 array
	"Type_Basic",		// 2 basic variable
	"Type_Ref",			// 3 function
	"Type_RefStruc",	// 4 function that definitely belongs to struct
	"Type_Struc",		// 5 structure
	"Type_File",		// 6 included file
];

'use babel';

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

export function file(name, hash, variables){
	this.name = name;
	this.hash = hash;
	this.variables = variables;
};

var counter;

export function main(){
	if (counter = undefined){
		counter = 0;
		console.log("COUNTER UNDEF");
	} else {
		counter++;
	}
	this.files = {}; //access or add members with this.files["filepath"]=variables;
}

//chars that signify a comment
export var charComment = '%';
//chars that will split the input
export var charStringSplit = new RegExp(/\(|\)|=|{|}|\[|\]|;/, 'g');
export var strStringSplit = new RegExp(/(define\s)|(typedef\s)|(variable\s)/, 'g');
//chars not allowed inside a variable name
export var varNameTabooChars = new RegExp(/^[0-9]|`|!|@|#|\$|%|\^|&|\*|-|\+|=|\||\\|:|'|"|,|\.|<|>|\/|\?/, 'g');
export var varKeywords = [
//0: var_type
//1: essential first regexp match
//2-3: name field surrounded by regexp
//4-5: data field surrounded by regexp
//6: limiter

//since "data" can be found earlier than "name",
//cycle text from first regexp match till limiter
//for each of the "name" and "data" fields

	//Type_Name		regexp		name0		name1		data0		data1		limiter
	["Type_None",	/\0/,		/\0/, 		/\0/, 		/\0/, 		/\0/,		/;/],//Type_None, should not find
	// ["Type_Array",	/\0/,		/\0/, 		/=/, 		/=/, 		/\[/,		/;/],//Type_Array
	// ["Type_Basic",	/variable/,	/variable/, /;/,		/\0/,		/\0/,		/;/],//Type_Basic, uninitialised
	["Type_Basic",	/variable/,	/variable/, /=/,		/=/,		/;/,		/;/],//Type_Basic, initialised
	["Type_Ref",	/define/, 	/define/,	/\(/,		/\(/,		/\)/,		/\)/],//Type_Ref
	["Type_Struc",	/typedef/,	/}/,		/;/,		/{/, 		/}/,		/;/],//Type_Struc
	["Type_File",	/require/,	/\(/,		/\)/,		'\0',		'\0',		/;/]//Type_File
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

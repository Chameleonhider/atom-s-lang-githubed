'use babel';

class slang_variable{
	//constructor
	//name - string
	//doc - string
	//type - varType
	//data - void, array, struct or function information
	variable (name, doc, type, data) {
		this.name = name;
		this.doc = doc;
		this.type = type;
		this.data = data;
	}
	/*four cases:
	Variable
		name string
		doc string
		type Type_Basic
		data void or value

	Structure
		name string
		doc string
		type Type_Struc
		data Variable_List

	Array
		name string
		doc string
		type Type_Array
		data Type_Of_Items

	Function
		name string with parameters
		doc string "qualifier"s goes here
		type Type_Ref
		data Structure owner of the function
	*/
}
slang_variable.varKeywords = {
	Type_None		: "",
	Type_Array		: "[;]",
	Type_Basic		: "variable",
	Type_Ref		: "define;(;)",
	Type_RefStruc	: "define;(;this;)",
	Type_Struc		: "typedef;struct;{;}",
	Type_File		: "require;(;\";\";)"
}
slang_variable.varType = {
	//only 1-7 should be used
	Type_None		: 0,
	Type_Array		: 1,
	Type_Basic		: 2,
	Type_Ref		: 3,
	Type_RefStruc	: 4, //function that definitely belongs to struct
	Type_Struc		: 5,
	Type_File		: 6, //included file
	Type_Undef		: 7
}

function slang_file(variables){
	this.variables = variables;
}

class slang_main{
	main(){
		this.files = {}; //access or add members with this.files["filepath"]
		this.addFile = function(filePath, variables) {
			files[filePath].variables = variables;
		};
	}
}

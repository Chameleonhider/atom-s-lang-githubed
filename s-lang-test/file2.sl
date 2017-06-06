%require("./filePath.sl");
require("../what");
require("./filePath.sl");
require("./filePath.sl");

typedef struct{
	a, c, e,
	x, y, z
}Random_struc;

define a(this, param0, param1){
	variable i=0;
}
%COMMENT define typedef ON A ;'90(){}[],.<>NEW LINE 0
define b(param0, param1){
	variable u=0; %A COMMENT ON AN EXISTING LINE%K % THX
	%COMMENT ON A NEW LINE 1
}

define c(this, param0){
	variable i=0;
}

define d(param0){
	variable u=0;
}

define e(this){
	variable i=0;
}

define f(){ %comment
	variable u=0;
}

variable randoms = Random_struc[99];
variable random = @Random_struc;

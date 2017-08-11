%require("./filePath.sl"); not needed
require("./require.sl");
require("./file.sl");
require("./no_file_found.sl");

%struct typedef struct comment {

typedef struct{
	x0, y0, z0
}Random_struc;

%COMMENT define typedef ON A ;'90(){}[],.<>NEW LINE 0


define x(this, param0){
	variable nvar; %A COMMENT ON AN EXISTING LINE%K % THX
	%COMMENT ON A NEW LINE 1
}

define z(param0){
}

%documentation
%let's define something
%documentation
define y(this){
}

define f(these){ %comment
	variable u=0;
}
\"variable do_not_find_this = 999;\\"\""
"variable do_not_find_this2 = 999;\\\""
variable string = "variable do not find this = 999;(){}";
variable randoms = Random_struc[99];
variable random = @Random_struc;
variable Random_struc.c = 0;

define functionwithEvenLongerName2(parameters of function ok){}

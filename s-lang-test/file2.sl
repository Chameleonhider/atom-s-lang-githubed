%require("./filePath.sl"); not needed
require("./require.sl");

typedef struct{
	x, y, z
}Random_struc;

%COMMENT define typedef ON A ;'90(){}[],.<>NEW LINE 0


define x(this, param0){
	variable u=0; %A COMMENT ON AN EXISTING LINE%K % THX
	%COMMENT ON A NEW LINE 1
}

define z(param0){
	variable u=0;
}

define y(this){
	variable i=0;
}

define f(){ %comment
	variable u=0;
}

variable randoms = Random_struc[99];
variable random = @Random_struc;

define functionwithEvenLongerName(paramters of function ok){}

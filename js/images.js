'use strict';


//##############################################
//-----------------IMAGES-----------------------
//##############################################
var IMG = {};

//Add images here, like this:
addImageFile("cube", "cube.png");
//you can use them like this:
//ctx.drawImage(IMG["cube"], x, y);

function addImageFile(name, fileName){
	IMG[name] = new Image();
	IMG[name].src = "img/"+fileName;
}






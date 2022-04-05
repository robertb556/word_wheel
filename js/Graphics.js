
/*
Simple framework, for a canvas.
Give it a <div> and it will fill it.
*/
//##############################################
//-----------------GRAPHICS---------------------
//##############################################
var Graphics = function(owner, parentElement, width, height){
	var me = Object.create(null);
	
	me.width = width;
	me.height = height;
	me.scale = 2;  //don't mess with this, it's automatic
	me.owner = owner;
	me.parentElement = parentElement; 
	me.canvases = new Array();
	me.topCanvas;
	me.frameCtx;  //the main ctx to draw on.  You could add others for optimization or if you wanted a semi-transparent layer etc.
	me.repaintAll = true;

	
	me.initialize = function(){
		//Set up Contexts
		me.frameCtx = me.newCanvas(1, null, 'black').getContext("2d");

		//Prevent default right click menu so we can use right clicks for input
		document.addEventListener("contextmenu", function(e){ e.preventDefault(); }, false);
	};
	
	me.newCanvas = function(zIndex, opacity, color){
		var canvas					= document.createElement("canvas");
		canvas.width				= me.width;
		canvas.height				= me.height;
		canvas.style.border			= '0px solid black';
		canvas.style.padding		= "0px 0px 0px 0px";
		canvas.style.margin			= "0px 0px 0px 0px";
		canvas.style.position		= 'absolute';
		canvas.style.top			= '0px';
		canvas.style.left			= '0px';
		canvas.style.zIndex			= zIndex;
		if(color !== null)			canvas.style.backgroundColor = color;
		if(opacity !== null)		canvas.style.opacity = opacity;
		document.getElementById("main").appendChild(canvas);
		
		if(me.topCanvas === undefined || zIndex > me.topCanvas.style.zIndex) me.topCanvas = canvas;

		var ctx = canvas.getContext("2d");
		ctx.save(); //initially save context cause we're going to restore it next. (probably not nessisary, but just in case).

		me.canvases.push(canvas);
		return canvas;
	};

	
	//DRAW METHODS
	me.start = function(){
		me.rescale();
		me.frame();
	};
	
	me.frame = function(){
		requestAnimationFrame(me.frame);
		
		//DRAW FRAME (redraw constantly for stuff like UI responsiveness)
		ctx = me.frameCtx;
		me.clearContext(ctx);
		owner.draw(ctx);
		ctx.restore();
		me.repaintAll = false;
	};

	me.clearContext = function(ctx){
		ctx.clearRect(0,0, me.width, me.height);
	};
	
	me.rescale = function(){
		//get window width & height
		var w = me.parentElement.offsetWidth;
		var h = me.parentElement.offsetHeight;

		//determine limiting axis (width or height)
		var wratio = w / me.width;
		var hratio = h / me.height;
		
		if(hratio < wratio) me.scale = hratio;
		else me.scale = wratio;
		
		//rescale
		for(var i=0; i<me.canvases.length; i++){
			var c = me.canvases[i];
			
			if(hratio < wratio){
				//me.width = Math.floor(w/me.scale);
				//c.width = me.width;
			}else{
				//me.height = Math.floor(h/me.scale);
				//c.height = me.height;
			}
			
			
			c.style.width = Math.floor(me.width * me.scale);
			c.style.height = Math.floor(me.height * me.scale);
			
		}
	};
	
	me.getTopCanvas = function(){
		return me.topCanvas;
	};
	
	me.initialize();
	return me;
};
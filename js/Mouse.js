
'use strict';

//##############################################
//-----------------MOUSE------------------------
//##############################################
var Mouse = function(game, graphics){
	var me = {};

	me.isDown = false;
	me.x = 0;  //current x position of mouse
	me.y = 0;  //current y position of mouse
	me.xDown = 0;  //x position of mouse when depressed
	me.yDown = 0;  //y position of mouse when depressed
	me.LEFT_MOUSE_BUTTON = 0;
	me.RIGHT_MOUSE_BUTTON = 2;
	me.lastX = 0;
	me.lastY = 0;
	me.game = game;
	me.graphics = graphics;
	me.canvas = me.graphics.getTopCanvas();

	me.isVertical = false;
	me.isHorizontal = false;

	
	me.init = function(){
		//input listeners
		me.canvas.addEventListener('mouseup', me.mouseup,   false);
		me.canvas.addEventListener('mousedown', me.mousedown, false);
		me.canvas.addEventListener('mousemove', me.mousemove, false);
		me.canvas.addEventListener('touchstart', me.touchstart, false);
		me.canvas.addEventListener('touchend', me.touchend, false);
		me.canvas.addEventListener('touchmove', me.touchmove, false);
	};

	me.onMouseup = function(){
		if(me.isVertical) game.wheels.snapVertical();
		if(me.isHorizontal) game.wheels.snapHorizontal();
		me.isVertical = false;
		me.isHorizontal = false;
		
	};

	me.onMousedown = function(){
		game.wheels.instantSnap();
		if(!game.wheels.isMovingHorizontal() && game.wheels.containsVertical(me.x, me.y) && !game.wheels.containsHorizontal(me.x, me.y)) me.isVertical = true;
		if(!game.wheels.isMovingVertical() && !game.wheels.containsVertical(me.x, me.y) &&  game.wheels.containsHorizontal(me.x, me.y)) me.isHorizontal = true;
	};

	me.onMousemove = function(){
		if(me.isVertical){
			game.wheels.verticalOffset(me.y - me.yDown);
		}
		if(me.isHorizontal){
			game.wheels.horizontalOffset(me.x - me.xDown);
		}
	};



	me.mouseup = function(event){
		if(!me.isDown) return; //don't double call
		me.isDown = false;
		me.onMouseup();
	};
	
	me.mousedown = function(event){
		if(me.isDown) return; //don't double call
		me.saveState(event);
		me.xDown = me.x;
		me.yDown = me.y;
		me.isDown = true;
		me.onMousedown();
	};

	me.mousemove = function(event){
		me.saveState(event);
		me.onMousemove();
	};

	me.touchstart = function(event){
		event.preventDefault();
		event = event.touches[0];
		me.mousedown(event);
	};

	me.touchend = function(event){
		event = event.touches[0];
		me.mouseup(event);
	};

	me.touchmove = function(event){
		event = event.touches[0];
		me.mousemove(event);
	};

	me.saveState = function(e){
		var r = me.canvas.getBoundingClientRect();
		me.lastX = me.x;
		me.lastY = me.y;
		me.x = (e.pageX - r.left)/me.graphics.scale;
		me.y = (e.pageY - r.top)/me.graphics.scale;
	};

	me.init();
	return me;
};
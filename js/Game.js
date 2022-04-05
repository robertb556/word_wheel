'use strict';

//##############################################
//-----------------CONSTS-----------------------
//##############################################
var SCREEN_WIDTH = 820; //in pixels
var SCREEN_HEIGHT = 820; //in pixels
var TICK_DURATION = 30;  //you can change the tick duration, it's independent to the graphics repaint.
var WHITE = '#FDF6EC';  //'#FFF8D5';
var MIN_WORD_LENGTH = 3;
var LONG_WORD_LENGTH = 5;
var SUPER_LONG_WORD_LENGTH = 7;

var LEVEL_COLORS = [
	'#0056f6',
	'#00a800',
	'#db00cd',
	'#555',
	'#f83a00',
	'#6c47ff',
	'#ab0022',
	'#ffa347',
	'#58f898',
	'#6b89ff',
	'#3ebefe',
	'#80d010'
];

//##############################################
//-----------------VARS-------------------------
//##############################################
var game;
var stop = false;

window.onload = function(){
	game = Game();
	game.start();
};

var Game = function(){
	var me = {};

	me.graphics;
	me.mouse;
	me.keyboard;
	me.gameObjects = [];
	me.wheels;
	me.seconds = 0;

	me.init = function(){
		me.graphics = Graphics(me, document.getElementById("windowSize"), SCREEN_WIDTH, SCREEN_HEIGHT);
		me.mouse = Mouse(me, me.graphics);
		me.keyboard = Keyboard();
		me.keyboard.addListener(me.onKeypress);
		me.dictionary = Dictionary();
		console.log("qty["+wordList.length+"]");
		me.graphics.start();
		me.wheels = Wheels(10,10);
		me.gameObjects.push(me.wheels);
	};

	me.start = function(){
		me.wheels.start();
		randomGoalAnimation();
		me.tickStep();
		setInterval(me.clockTick, 1000);
	};

	me.clockTick = function(){
		me.seconds++;
	};

	me.getFormattedTime = function(){
		var min = Math.floor(me.seconds / 60);
		var sec = me.seconds % 60;
		if(sec < 10) sec = "0" + sec;
		return min + ":" + sec;
	};

	me.tickStep = function(){
		//Game loop code here

		//eg:
		for(var i=0; i<me.gameObjects.length; i++) me.gameObjects[i].tickStep(TICK_DURATION);
	
		if(!stop) setTimeout(me.tickStep, TICK_DURATION);  //leave this here at the end
	};

	me.draw = function(ctx){
		for(var i=0; i<me.gameObjects.length; i++) me.gameObjects[i].draw(ctx);
	};

	me.onKeypress = function(keycode){
		var char = KEYCODE_TO_CHAR[keycode];
		if(char === 'Up'){
			me.wheels.shiftUp();
		}
		if(char === 'Down'){
			me.wheels.shiftDown();
		}
		if(char === 'Left'){
			me.wheels.shiftLeft();
		}
		if(char === 'Right'){
			me.wheels.shiftRight();
		}
	};

	me.addGameObject = function(obj){
		me.gameObjects.push(obj);
	};

	me.removeGameObject = function(obj){
		var index = 0;
		while(index < me.gameObjects.length){
			if(me.gameObjects[index] === obj){
				me.gameObjects.splice(index,1);
			} else {
				index++;
			}
		}
	};

	me.init();
	return me;
};

//var wordList = [];
var Dictionary = function(){
    var me = {};

    me.wordsByLength = [];

    me.init = function(){
		//me.parseRawWordList();

		for(var i=0; i<50; i++){
			me.wordsByLength[i] = [];
		}
		for(var i=0; i<wordList.length; i++){
			var word = wordList[i];
			var sameLengthWords = me.wordsByLength[word.length];
			sameLengthWords[word] = true;
		}
    };

	me.parseRawWordList = function(){
		var words = rawWordList.split(/\s+/);
		for(var i=0; i<words.length; i++){
			var word = words[i];
			if(word.length < 3) continue;
			if(word.indexOf('#') !== -1) continue;
			if(word.indexOf("'") !== -1) continue;
			if(word.indexOf(':') !== -1) continue;
			if(word.indexOf('.') !== -1) continue;
			if(word.indexOf('_') !== -1) continue;
			if(word.indexOf('-') !== -1) continue;
			if(word.indexOf('1') !== -1) continue;
			if(word.indexOf('2') !== -1) continue;
			if(word.indexOf('3') !== -1) continue;
			if(word.indexOf('4') !== -1) continue;
			if(word.indexOf('5') !== -1) continue;
			if(word.indexOf('6') !== -1) continue;
			if(word.indexOf('7') !== -1) continue;
			if(word.indexOf('8') !== -1) continue;
			if(word.indexOf('9') !== -1) continue;
			if(word.indexOf('0') !== -1) continue;
			if(word.indexOf('[') !== -1) continue;
			if(word.indexOf(']') !== -1) continue;
			if(word.indexOf('|') !== -1) continue;
			if(word.indexOf('/') !== -1) continue;

			wordList.push(word);
		}
	};

    me.has = function(str){
		str = str.toLowerCase();
        var sameLengthWords = me.wordsByLength[str.length];
		return (typeof sameLengthWords[str] !== 'undefined');
    };
    
    me.init();
    return me;
};
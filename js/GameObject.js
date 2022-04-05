//'use strict';

var GameObject = function(x, y, w, h){
	var me = {};

	me.id = getNextId();
	me.x = x;
	me.y = y;
	me.w = w;
	me.h = h;
	me.img = null;

	me.tickStep = function(tickDuration){
		//game loop stuff. Eg. physics.
		//This is actually a good place for animations, since the game loop is a regular interval, where as the Graphics redraw is not.
	};

	me.draw = function(ctx){
		//Example stuff:
		
		//images
		ctx.drawImage(IMG['cube'], me.x, me.y, me.w, me.h);

		//basic fill
		//ctx.fillStyle = "red";
		//ctx.fillRect(me.x, me.y, me.w, me.h);

		/*
		//text
		ctx.textAlign = "left";
		ctx.font = "12px Verdana";
		ctx.fillText("My Text", me.x, me.y);
		*/
	};

	me.contains = function(x, y){
		if(
			me.x <= x &&
			me.y <= y &&
			me.x + me.w >= x &&
			me.y + me.h >= y
		) return true;
		else return false;
	};

	me.addChild = function(child){
		me.children.push(child);
	};

	return me;
};

var AnimationObj = function(){
	var me = GameObject(0,0,1,1);
	game.addGameObject(me);

	me.duration = -1;

	me.tickStep = function(tickDuration){
		me.onTickStep(tickDuration);

		if(me.duration > 0) me.duration--;
		if(me.duration === 0) game.removeGameObject(me);
	};

	me.onTickStep = function(tickDuration){

	};

	return me;
};

var randomGoalAnimation = function(){
	var me = AnimationObj();

	me.goals = [
		'Find 20 words in 5 min.',
		'Reach level 2 in\nunder 30 ops.',
		'Reach level 2 in\nunder 2 min.',
		'Find 3 long (5-6\nletter) words.',
		'Find an extra long\n(7+ letter) word.',
		'Find at least 20 words\nbefore level 2.',
		'Find a "double"(two\noverlapping words).',
		'Try to reach level 5.',
	];

	me.duration = 280;
	me.initialFlashTime = 2;
	me.flashGrowAmount = 1;
	me.count = 0;
	me.currentFlashTime = me.initialFlashTime;
	me.currentGoalIndex = Math.floor(Math.random() * me.goals.length);
	me.blink = 1;

	me.draw = function(ctx){
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
		ctx.textAlign = "center";
		ctx.font = "800 56px courier";
		ctx.fillStyle = "red";
		var x = 420;
		var y = 300;
		ctx.fillStyle = "white";
		var lines = me.goals[me.currentGoalIndex].split("\n");
		for(var i=0; i<lines.length; i++){
			if(me.blink > 10 || me.blink % 3 !== 0) ctx.fillText(lines[i], x, y);
			y += 70;
		}

		if(me.duration < 200){
			if(me.count % 20 === 0) me.blink++;
		}else if(me.count === me.currentFlashTime){
			me.count = 0;
			me.currentFlashTime += me.flashGrowAmount;
			me.currentGoalIndex++;
			if(me.currentGoalIndex >= me.goals.length) me.currentGoalIndex = 0;
		}
		me.count++;
	};

	return me;
};

var WordAnimation = function(cells){
	var me = AnimationObj();

	me.duration = 300;
	me.isVertical = cells[0].isVertical;
	me.angle = game.wheels.getNextAngle();
	me.velocity = 5;
	me.cells = cells;
	me.x = me.cells[0].x;
	me.y = me.cells[0].y;

	me.draw = function(ctx){
		var first = me.cells[0];
		ctx.save();
		ctx.translate(me.x + game.wheels.getCellX(first), me.y + game.wheels.getCellY(first));
		for(var i=0; i<me.cells.length; i++){
			var cell = me.cells[i];
			ctx.save();
			if(me.isVertical) ctx.translate(0, i * CELL_SIZE);
			else ctx.translate(i * CELL_SIZE, 0);
			cell.drawAnimation(ctx);
			ctx.restore();
		}
		ctx.restore();
	};

	me.onTickStep = function(tickDuration){
		me.x += me.velocity * Math.cos(me.angle);
		me.y += me.velocity * Math.sin(me.angle);
	};

	return me;
};


var CELL_SIZE = 66;
var WHEEL_QTY = 11;
var Wheels = function(x, y){
	var me = GameObject(x, y, 800, 800);

	me.level = 0;
	me.opsCount = 0;
	me.totalWordCount = 0;
	me.longWordCount = 0;
	me.superLongWordCount = 0;
	me.doubleWordCount = 0;

	me.angle = Math.PI / 4;  //for animating words that were found flying off in different directions
	
	me.cells = [];
	me.vWheel = [];
	me.hWheel = [];
	me.vPos = 0;  //integer, index offset, for wheel rotation
	me.hPos = 0;
	me.lastVPos = me.vPos;
	me.lastHPos = me.hPos;
	me.vOffset = 0;  //for mouse dragging animation
	me.hOffset = 0;
	me.vSnap = 0;  //for animating snapping into place
	me.hSnap = 0;
	me.wheelCenterX = me.x + Math.floor(me.w/2) - Math.floor(CELL_SIZE/2);  //location of center
	me.wheelCenterY = me.y + Math.floor(me.h/2) - Math.floor(CELL_SIZE/2);

	//me.color = "#33B";
	//me.hoverColor = "#119";


	me.init = function(){
		for(var i=0; i<WHEEL_QTY; i++){
			var cell = Cell(me, true, i);
			me.vWheel.push(cell);
			me.cells.push(cell);
		}
		for(var i=0; i<WHEEL_QTY; i++){
			var cell = Cell(me, false, i);
			me.hWheel.push(cell);
			me.cells.push(cell);
		}
		me.syncCenterCellUsing(true);
	};

	me.start = function(){
		console.log("starting");
		me.randomizeAwayWords();
	};

	me.tickStep = function(tickDuration){
		for(var i=0; i<me.cells.length; i++) me.cells[i].tickStep(tickDuration);

		me.autoSnap();
		if(me.canLevelUp()) me.levelUp();
	};

	me.canLevelUp = function(){
		for(var i=0; i<me.cells.length; i++) if(me.cells[i].level <= me.level) return;
	};

	me.levelUp = function(){
		for(var i=0; i<me.cells.length; i++) if(me.cells[i].level <= me.level) me.cells[i].levelUp();
		me.level++;
		me.randomizeAwayWords();
	};

	me.instantSnap = function(){
		if(me.isMovingVertical()) me.lockInWheel(true);
		if(me.isMovingHorizontal()) me.lockInWheel(false);
	};

	me.autoSnap = function(){
		if(me.isMovingVertical()){
			me.vSnap -= me.vSnap * 0.08;
			if(Math.abs(me.vSnap) < 3){
				me.lockInWheel(true);
			}
		}
		
		if(me.isMovingHorizontal()){
			me.hSnap -= me.hSnap * 0.08;
			if(Math.abs(me.hSnap) < 3){
				me.lockInWheel(false);
			}
		}
	};

	me.lockInWheel = function(isVertical){
		me.syncCenterCellUsing(isVertical);
		me.vSnap = 0;
		me.hSnap = 0;
		var isNewLocation = false;
		if(isVertical && me.vPos !== me.lastVPos) isNewLocation = true;
		if(!isVertical && me.hPos !== me.lastHPos) isNewLocation = true;
		if(isNewLocation){
			me.scoreWords();
			me.opsCount++;
		}
	};

	me.isMovingVertical = function(){
		if(me.vSnap !== 0) return true;
		else return false;
	};

	me.isMovingHorizontal = function(){
		if(me.hSnap !== 0) return true;
		else return false;
	};

	me.getNextAngle = function(){
		me.angle += Math.PI / 2;
		return me.angle;
	};

	me.syncCenterCellUsing = function(verticalOnTop){
		/*
		if(verticalOnTop) me.hWheel[me.hPos] = me.vWheel[me.vPos];
		else me.vWheel[me.vPos] = me.hWheel[me.hPos];
		*/
		
		if(verticalOnTop){
			var master = me.vWheel[me.vPos];
			var slave = me.hWheel[me.hPos];
		} else{
			var slave = me.vWheel[me.vPos];
			var master = me.hWheel[me.hPos];
		}
		slave.char = master.char;
		slave.level = master.level;
		slave.hasScored = master.hasScored;
	};

	me.draw = function(ctx){
		me.drawVerticalWheel(ctx);
		me.drawHorizontalWheel(ctx);
		me.drawMask(ctx);
		me.drawStats(ctx);
	};

	me.getCellX = function(cell){
		if(cell.isVertical){
			var x = me.wheelCenterX;
		}else{
			var x = me.wheelCenterX + cell.wheelIndex * CELL_SIZE - me.hPos * CELL_SIZE + me.hOffset + me.hSnap;
			while(x > me.w - 2 * CELL_SIZE) x -= CELL_SIZE * WHEEL_QTY;
			while(x < 0 - 4 * CELL_SIZE) x += CELL_SIZE * WHEEL_QTY;
		}
		return x;
	};

	me.getCellY = function(cell){
		if(cell.isVertical){
			var y = me.wheelCenterY + cell.wheelIndex * CELL_SIZE - me.vPos * CELL_SIZE + me.vOffset + me.vSnap;
			while(y > me.h - 2 * CELL_SIZE) y -= CELL_SIZE * WHEEL_QTY;
			while(y < 0 - 4 * CELL_SIZE) y += CELL_SIZE * WHEEL_QTY;
		}else{
			var y = me.wheelCenterY;
		}
		return y;
	};

	me.drawStats = function(ctx){
		var x1 = 60;
		var x2 = 520;
		var y1 = 100;
		var y2 = 620;
		var ys = 65;

		ctx.textAlign = "left";
		ctx.font = "44px courier";
		ctx.fillStyle = WHITE;

		me.drawStatPair(x1, y1, "MIN", game.getFormattedTime());
		me.drawStatPair(x2, y1, "Level", me.level + 1);

		me.drawStatPair(x1, y2, "ops", me.opsCount);
		me.drawStatPair(x1, y2+ys, "wrds", me.totalWordCount);
		me.drawStatPair(x1, y2+ys+ys, "long", me.longWordCount);

		me.drawStatPair(x2, y2, "x-long", me.superLongWordCount);
		me.drawStatPair(x2, y2+ys, "double", me.doubleWordCount);
	};

	me.drawStatPair = function(x, y, text, value){
		ctx.textAlign = "left";
		ctx.fillText(text, x, y);
		ctx.textAlign = "right";
		ctx.fillText(value, x + 240, y);
	};

	me.drawVerticalWheel = function(ctx){
		for(var i=0; i<me.vWheel.length; i++){
			var cell = me.vWheel[i];
			var x = me.getCellX(cell);
			var y = me.getCellY(cell);

			
			//ctx.translate(x, y);
			if((me.hSnap === 0 && me.hOffset === 0) || y !== me.wheelCenterY) cell.draw(ctx);
			ctx.save();
			ctx.translate(0, CELL_SIZE * WHEEL_QTY);
			cell.draw(ctx);
			ctx.restore();
		}
	};

	me.drawHorizontalWheel = function(ctx){
		for(var i=0; i<me.hWheel.length; i++){
			var cell = me.hWheel[i];
			var x = me.getCellX(cell);
			var y = me.getCellY(cell);
			
			
			//ctx.translate(x, y);
			if((me.vSnap === 0 && me.vOffset === 0) || x !== me.wheelCenterX) cell.draw(ctx);
			ctx.save();
			ctx.translate(CELL_SIZE * WHEEL_QTY, 0);
			cell.draw(ctx);
			ctx.restore();
		}
	};

	me.drawMask = function(ctx){
		var borderThickness = 40;
		ctx.fillStyle = "black";
		ctx.fillRect(0, me.y+borderThickness, SCREEN_WIDTH, -100);
		ctx.fillRect(0, me.y+me.h-borderThickness, SCREEN_WIDTH, 100);
		ctx.fillRect(me.x+borderThickness, 0, -100, SCREEN_HEIGHT);
		ctx.fillRect(me.x+me.w-borderThickness, 0, 600, SCREEN_HEIGHT);
	};

	me.setVPos = function(val){
		me.lastVPos = me.vPos;
		me.vPos = val;
		while(me.vPos > me.vWheel.length - 1) me.vPos -= me.vWheel.length;
		while(me.vPos < 0) me.vPos += me.vWheel.length;
	};

	me.setHPos = function(val){
		me.lastHPos = me.hPos;
		me.hPos = val;
		while(me.hPos > me.hWheel.length - 1) me.hPos -= me.hWheel.length;
		while(me.hPos < 0) me.hPos += me.hWheel.length;
	};

	me.shiftUp = function(){
		me.setVPos(me.vPos+1);
		me.vSnap = CELL_SIZE;
		me.vOffset = 0;
	};

	me.shiftDown = function(){
		me.setVPos(me.vPos-1);
		me.vSnap = -CELL_SIZE;
		me.vOffset = 0;
	};

	me.shiftLeft = function(){
		me.setHPos(me.hPos+1);
		me.hSnap = CELL_SIZE;
		me.hOffset = 0;
	};

	me.shiftRight = function(){
		me.setHPos(me.hPos-1);
		me.hSnap = -CELL_SIZE;
		me.hOffset = 0;
	};

	me.verticalOffset = function(offset){
		me.vOffset = offset;
	};

	me.horizontalOffset = function(offset){
		me.hOffset = offset;
	};

	me.snapVertical = function(){
		var delta = Math.round(me.vOffset / CELL_SIZE);
		var r = me.vOffset % CELL_SIZE;
		if(r > Math.floor(CELL_SIZE/2)) r -= CELL_SIZE;
		if(r < -1*Math.floor(CELL_SIZE/2)) r += CELL_SIZE;
		me.setVPos(me.vPos - delta);
		me.vSnap = r;
		me.vOffset = 0;
	}

	me.snapHorizontal = function(){
		var delta = Math.round(me.hOffset / CELL_SIZE);
		var r = me.hOffset % CELL_SIZE;
		if(r > Math.floor(CELL_SIZE/2)) r -= CELL_SIZE;
		if(r < -1*Math.floor(CELL_SIZE/2)) r += CELL_SIZE;
		me.setHPos(me.hPos - delta);
		me.hSnap = r;
		me.hOffset = 0;
	}

	me.containsVertical = function(x, y){
		if(x > me.wheelCenterX && x < me.wheelCenterX + CELL_SIZE) return true;
		return false;
	};

	me.containsHorizontal = function(x, y){
		if(y > me.wheelCenterY && y < me.wheelCenterY + CELL_SIZE) return true;
		return false;
	};

	me.randomizeAwayWords = function(){
		didFindWord = true;
		while(didFindWord){
			var didFindWord = false;
			var cells = me.findWord();
			if(cells !== null){
				me.randomizeAway(cells);
				me.syncCenterCellUsing(cells[0].isVertical);
				didFindWord = true;
			}
		}
	};

	me.scoreWords = function(){
		console.log("-----");
		me.getAllNovelWords();
	};

	me.isNovelWord = function(cells){
		for(var i=0; i<cells.length; i++) if(!cells[i].hasScored) return true;
		return false;
	};

	me.randomizeAway = function(cells){
		for(var i=0; i<cells.length; i++){
			var cell = cells[i];
			cell.randomize();
		}
	};

	me.scoreWord = function(cells){
		for(var i=0; i<cells.length; i++){
			var cell = cells[i];
			cell.score();
			if(cell.isVertical  && cell.wheelIndex === me.vPos){
				me.syncCenterCellUsing(true);
			}
			if(!cell.isVertical && cell.wheelIndex === me.hPos){
				me.syncCenterCellUsing(false);
			}
		}
		WordAnimation(cells);
	};

	me.getAllNovelWords = function(){
		var isVerticals = [true, false];
		var words = [];
		var verticalWordsCount = 0;
		var horizontalWordsCount = 0;
		//search from longest to shortest words
		for(var i=WHEEL_QTY; i>=MIN_WORD_LENGTH; i--){
			//start at each position
			for(var j=0; j<WHEEL_QTY; j++){
				for(var k=0; k<isVerticals.length; k++){
					//vertical or horizontal
					var isVertical = isVerticals[k];

					//check for word
					var testStr = me.getTestStr(isVertical, j, i);
					if(game.dictionary.has(testStr)){
						var cells = me.dataToCells(isVertical, j, i);
						if(me.isNovelWord(cells)){
							console.log("word["+testStr+"]");
							me.scoreWord(cells);
							
							if(isVertical) verticalWordsCount++;
							else horizontalWordsCount++;

							if(cells.length >= SUPER_LONG_WORD_LENGTH) me.superLongWordCount++;
							else if(cells.length >= LONG_WORD_LENGTH) me.longWordCount++;
							me.totalWordCount++;

							words.push(cells);
						}
					}
				}
			}
		}
		if(verticalWordsCount > 1) me.doubleWordCount += verticalWordsCount - 1;
		if(horizontalWordsCount > 1) me.doubleWordCount += horizontalWordsCount - 1;
		return words;
	};

	me.findWord = function(){
		//search from longest to shortest words
		for(var i=WHEEL_QTY; i>=MIN_WORD_LENGTH; i--){
			//start at each position
			for(var j=0; j<WHEEL_QTY; j++){
				//vertical
				var testStr = me.getTestStr(true, j, i);
				if(game.dictionary.has(testStr)){
					return me.dataToCells(true, j, i);
				}

				//horizontal
				testStr = me.getTestStr(false, j, i);
				if(game.dictionary.has(testStr)){
					return me.dataToCells(false, j, i);
				}
			}
		}
		return null;
	};

	me.dataToCells = function(isVertical, index, length){
		var cells = [];
		var wheel = isVertical ? me.vWheel : me.hWheel;
		while(length > 0){
			if(index > wheel.length - 1) index -= wheel.length;
			var cell = wheel[index];
			cells.push(cell);
			index++;
			length--;
		}
		return cells;
	};

	me.getTestStr = function(isVertical, index, length){
		var wheel = me.vWheel;
		if(!isVertical) wheel = me.hWheel;
		var testStr = "";
		while(length > 0){
			if(index > wheel.length - 1) index -= wheel.length;
			testStr += wheel[index].char;
			index++;
			length--;
		}
		return testStr;
	};

	me.init();
	return me;
};

var CHAR_LIST = "AAAAAAAABBCCCDDDDEEEEEEEEEEEEFFFGGHHHHHHIIIIIIIIJKLLLLMMMNNNNNNNNOOOOOOOOPPRRRRRRSSSSSSSSTTTTTTTTTUUUVWWXYYZ";
var Cell = function(parent, isVertical, wheelIndex){
	var me = GameObject(0, 0, CELL_SIZE, CELL_SIZE);

	me.parent = parent;
	me.isVertical = isVertical;
	me.wheelIndex = wheelIndex;
	me.hasScored = false;
	me.char = 'C';
	me.level = 0;

	me.levelColors = [
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

	me.init = function(){
		me.randomize();
	};

	me.score = function(){
		me.hasScored = true;
	};

	me.levelUp = function(){
		me.hasScored = false;
		me.randomize();
	};

	me.randomize = function(){
		var randIndex = Math.floor(Math.random() * CHAR_LIST.length);
		me.char = CHAR_LIST.charAt(randIndex);
	};

	me.draw = function(ctx){
		me.drawDetails(ctx, false);
	};

	me.drawAnimation = function(ctx){
		me.drawDetails(ctx, true, true);
	};

	me.drawDetails = function(ctx, useOrigin){
		var char = me.char;
		var bg = me.levelColors[me.parent.level];
		var fg = WHITE;
		if(!me.hasScored){
			var temp = bg;
			bg = fg;
			fg = temp;
		}

		var xx = 0;
		var yy = 0;
		if(!useOrigin){
			xx = me.parent.getCellX(me);
			yy = me.parent.getCellY(me);
		}

		ctx.fillStyle = bg;
		ctx.fillRect(xx+2, yy+2, me.w-4, me.h-4);

		ctx.fillStyle = fg;
		ctx.textAlign = "center";
		ctx.font = "44px Verdana";
		ctx.fillText(char, xx+Math.floor(CELL_SIZE/2), yy+Math.floor(CELL_SIZE/2)+16);
	};

	me.init();
	return me;
};
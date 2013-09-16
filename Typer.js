'use strict';
 
function Typer(element, bps) {
 
	if (! (element instanceof Element)) {
		if (element.charAt(0) == '#') {
			element = document.getElementById(element.slice(1));
		}
		else {
			element = document.querySelector(element);
		}
	}
 
	var typer = this;
 
	this.node = element;

	this.fragment = document.createDocumentFragment();
 
	this.targetText = document.createElement('div');

	this.fragment.appendChild(this.targetText);
 
	this.cursor = document.createElement('div');
 
	this.cursor.innerHTML = ' |';
 
	this.cursor.style.display = this.targetText.style.display = 'inline';
 
	this.fragment.appendChild(this.cursor);
 
	this.timers = { typing: null, deleting: null, cursor: null };
 
	this.cursorVisible = true;
 
	this.blinkCursor = function(bps) {
		this.timers.cursor = setInterval(function() {
			typer.cursorVisible = ! typer.cursorVisible;
 
			typer.cursor.style.opacity = Number(typer.cursorVisible);
		}, 1000/(bps || 2));
	};
 
	this.stopCursor = function(visible) {
		this.cursorVisible = Boolean(visible);
		this.cursor.style.opacity = Number(visible);
		clearInterval(this.timers.cursor);
	};

	this.node.appendChild(this.fragment);
	this.blinkCursor(bps);
}
 
Typer.prototype.write = function(text, cps, callback) {
	var fn = callback,
		charsPerSecond = cps;

	if (typeof cps == 'function') {
		fn = cps;
		charsPerSecond = callback;
	}

	this.targetText.innerHTML = '';
	this.type(text, charsPerSecond, fn);
};
 
Typer.prototype.type = function(text, cps, callback) {
	clearInterval(this.timers.typing);
	this.stopCursor(true);
	var characters = text.split(''), typer = this;
	this.timers.typing = setInterval(function() {
		
		if (characters.length > 0) {
			typer.targetText.innerHTML += characters.shift();
		}
		else {
			typer.blinkCursor();
			clearInterval(typer.timers.typing);

			if (typeof callback == 'function') {
				callback();
			}
		}
	}, 1000/(cps || 20));
};
 
Typer.prototype.retype = function(text, cps, dcps, callback) {
	clearInterval(this.timers.typing);
	clearInterval(this.timers.deleting);
	var characters = text.split(''),
		targetText = this.targetText.innerHTML,
		targetCharacters = targetText.split(''),
		typer = this;
 
	var diffPos = 0;
 
	if (! targetCharacters.length) return this.write(text, cps, callback);

	if (text == targetText.slice(0, text.length)) {
		diffPos = text.length;
	}
	else {
		for (var i in characters) {
			var cchar = characters[i];

			if (cchar != targetCharacters[i]) {
				diffPos = i;
				break;
			}
		}
	}
 
	this.timers.deleting = setInterval(function() {
 
		if (diffPos < typer.targetText.innerHTML.length) {
			typer.targetText.innerHTML = typer.targetText.innerHTML.slice(0, typer.targetText.innerHTML.length-1);
		}
		else {
			clearInterval(typer.timers.deleting);
 
			typer.type(text.slice(diffPos), cps, callback);
		}
 
	}, 1000/(dcps || 50));
};
 
Typer.prototype.retypeInterval = function(arr, interval, cps, dcps) {
	var typer = this;
	var index = 0, current;

	function change() {
		current = arr[index];
		
		typer.retype(current, cps, dcps, function() {
			setTimeout(change, interval);
		});
 
		if (index == arr.length-1) {
			index = -1;
		}
 
		index++;
	}

	change();
};
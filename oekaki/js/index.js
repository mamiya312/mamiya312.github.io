'use strict';

window.onload = function(){
	var app = new App();
};

var Class = function(parent){
	var _class = function(){
		this.init.apply(this,arguments);
	};
	if(parent){
		var Subclass = function(){};
		Subclass.prototype = parent.prototype;
		_class.prototype = new Subclass();
	}
	_class.prototype.init = function(){};
	return _class;
};
var Base = new Class();
Base.fn = Base.prototype;
Base.fn.init = function(){};
Base.fn.addEvent = function(elm,evt,callback,b){
	var _self = this;
	elm.addEventListener(evt,function(e){
		callback.call(_self,e);
	},b);
};

var App = new Class();
App.fn = App.prototype;
App.fn.init = function(){
	var _self = this;
	this.canvas = document.getElementById('top');
	this.bottomCanvas = document.getElementById('bottom');
	this.ctx = this.canvas.getContext('2d');
	this.bctx = this.bottomCanvas.getContext('2d');
	
	this.uuid = '';
	this.prevs = {};

	this.uiSize  = document.getElementById('size');
	this.uiColor = document.getElementById('color');

	this.ws = new WebSocket('ws://test.mfmican.net/oekaki');
	this.ws.onopen = function(){
		this.mouse = new Mouse(_self);
	};
	this.ws.onmessage = function(d){
		var json = JSON.parse(d.data);
		console.log(json);
		var p = {};
		if(json.cmd==='b'||(json.cmd==='m'&&!(json.uuid in _self.prevs))){
			p.x = json.x;
			p.y = json.y;
			_self.prevs[json.uuid] = p;
		}else if(json.cmd ==='m'){
			p.x = json.x;
			p.y = json.y;
			_self.bctx.strokeStyle = 'rgb('+json.c[0]+','+json.c[1]+','+json.c[2]+')';
			_self.bctx.fillStyle = 'rgb('+json.c[0]+','+json.c[1]+','+json.c[2]+')';
			_self.bctx.lineWidth = json.s;
			_self.bctx.beginPath();
			_self.bctx.moveTo(_self.prevs[json.uuid].x,_self.prevs[json.uuid].y);
			_self.bctx.lineTo(p.x,p.y);
			_self.bctx.stroke();
			_self.prevs[json.uuid] = p;
		}else if(json.cmd === 'u'){
			delete _self.prevs[json.uuid];
		}else if(json.cmd === 'client'){
			_self.uuid = json.uuid;
		}
	};
};
App.fn.send = function(val){
	val.uuid = this.uuid;
	val.s = parseInt(this.uiSize.value,10);
	var tmp = this.uiColor.value;
	var c = [];
	c[0] = parseInt(tmp[1]+tmp[2],16);
	c[1] = parseInt(tmp[3]+tmp[4],16);
	c[2] = parseInt(tmp[5]+tmp[6],16);
	val.c = c;
	this.ws.send(JSON.stringify(val));
};


var Input = new Class();
Input.fn = Input.prototype;
Input.fn.init = function(app){
	this.app = app;
};
var Mouse = new Class(Base);
Mouse.fn = Mouse.prototype;
Mouse.fn.init = function(app){
	this.app = app;
	this.leftButtonState = false;
	this.LEFT_BUTTON = 0;
	this.RIGHT_BUTTON = 1;
	this.WHIIL_BUTTON = 2;
	this.addEvent(this.app.canvas,'mousedown',this.down,false);
	this.addEvent(this.app.canvas,'mouseup',this.up,false);
	this.addEvent(this.app.canvas,'mousemove',this.move,false);
	this.addEvent(this.app.canvas,'mouseover',this.over,false);
};
Mouse.fn.getPosition = function(e){
	var position = {};
	position.x = e.layerX;
	position.y = e.layerY;
	return position;
};
Mouse.fn.down = function(e){
	if(e.button===this.LEFT_BUTTON){
		this.leftButtonState = true;
		var p = this.getPosition(e);
		//this.app.ctx.beginPath();
		//this.app.ctx.moveTo(p.x,p.y);
		this.app.send({'cmd':'d','y':p.y,'x':p.x});
	}
};
Mouse.fn.up = function(e){
	if(e.button===this.LEFT_BUTTON){
		this.leftButtonState = false;
		var p = this.getPosition(e);
		//this.app.ctx.lineTo(p.x,p.y);
		//this.app.ctx.stroke();
		this.app.send({'cmd':'u','y':p.y,'x':p.x});
	}
};
Mouse.fn.move = function(e){
	if(this.leftButtonState===true){
		var p = this.getPosition(e);
		//this.app.ctx.lineTo(p.x,p.y);
		//this.app.ctx.stroke();
		this.app.send({'cmd':'m','y':p.y,'x':p.x});
	}
};
Mouse.fn.over = function(e){
	if(this.leftButtonState===true){
		var p = this.getPosition(e);
		//this.app.ctx.beginPath();
		this.app.ctx.moveTo(p.x,p.y);
	}
};


'use strict';

/**
 * ・切断原因の調査と再接続の実装
 * 　再接続後に受信しそこねてたやつどうするか
 */


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
Base.fn.addEvent = function(elm,evt,callback,b){
	var _self = this;
	elm.addEventListener(evt,function(e){
		callback.call(_self,e);
	},b);
};

var App = new Class(Base);
App.fn = App.prototype;
App.fn.init = function(){
	var _self = this;
	this.topCanvas = document.getElementById('top');
	this.bottomCanvas = document.getElementById('bottom');
	this.tctx = this.topCanvas.getContext('2d');
	this.bctx = this.bottomCanvas.getContext('2d');

	this.uuid = '';
	this.prevs = {};

	this.uiSize  = document.getElementById('size');
	this.uiColor = document.getElementById('color');

	this.ws = new WebSocket('ws://test.mfmican.net/oekaki');
	//this.ws.onopen = function(){
	//	this.mouse = new Mouse(_self);
	//};
	this.addEvent(this.ws,'message',this.onMessage);
	this.addEvent(this.ws,'open',this.onOpen);
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
App.fn.onOpen = function(){
	if(!('mouse' in this) || this.mouse===null){
		console.log('setMouse');
		this.mouse = new Mouse(this);
	}
};
App.fn.onMessage = function(d){
	var json = JSON.parse(d.data);
	var p = {};
	console.log(json);
	if(json.cmd==='b'||(json.cmd==='m'&&!(json.uuid in this.prevs))){
		p.x = json.x;
		p.y = json.y;
		this.prevs[json.uuid] = p;
	}else if(json.cmd ==='m'){
		p.x = json.x;
		p.y = json.y;
		this.bctx.strokeStyle = 'rgb('+json.c[0]+','+json.c[1]+','+json.c[2]+')';
		this.bctx.fillStyle = 'rgb('+json.c[0]+','+json.c[1]+','+json.c[2]+')';
		this.bctx.beginPath();
		this.bctx.lineWidth = json.s;
		this.bctx.moveTo(this.prevs[json.uuid].x,this.prevs[json.uuid].y);
		this.bctx.lineTo(p.x,p.y);
		this.bctx.stroke();
		if(json.s!==1){
			this.bctx.lineWidth = 0;
			this.bctx.beginPath();
			this.bctx.arc(p.x,p.y,json.s/2.0,0,Math.PI*2,true);
			this.bctx.fill();
		}
		this.prevs[json.uuid] = p;
	}else if(json.cmd === 'u'){
		delete this.prevs[json.uuid];
	}else if(json.cmd === 'd'){
		p.x = json.x;
		p.y = json.y;
		this.bctx.strokeStyle = 'rgb('+json.c[0]+','+json.c[1]+','+json.c[2]+')';
		this.bctx.fillStyle = 'rgb('+json.c[0]+','+json.c[1]+','+json.c[2]+')';
		this.bctx.lineWidth = 0;
		this.bctx.beginPath();
		this.bctx.moveTo(this.prevs[json.uuid].x,this.prevs[json.uuid].y);
		this.bctx.lineTo(p.x,p.y);
		this.bctx.stroke();
		if(json.s !== 1){
			this.lineWidth = 0;
			this.beginPath();
			this.bctx.arc(p.x,p.y,json.s/2.0,0,Math.PI*2,true);
			this.bctx.fill();
		}
	}else if(json.cmd === 'client'){
		this.uuid = json.uuid;
	}
};


var Input = new Class(Base);
Input.fn = Input.prototype;
Input.fn.init = function(app){
	this.app = app;
};
var Mouse = new Class(Input);
Mouse.fn = Mouse.prototype;
Mouse.fn.init = function(app){
	this.app = app;
	this.leftButtonState = false;
	this.LEFT_BUTTON = 0;
	this.RIGHT_BUTTON = 1;
	this.WHIIL_BUTTON = 2;
	this.addEvent(this.app.topCanvas,'mousedown',this.down,false);
	this.addEvent(this.app.topCanvas,'mouseup',this.up,false);
	this.addEvent(this.app.topCanvas,'mousemove',this.move,false);
	this.addEvent(this.app.topCanvas,'mouseover',this.over,false);
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
	var p = this.getPosition(e);
	if(this.leftButtonState===true){
		//this.app.ctx.lineTo(p.x,p.y);
		//this.app.ctx.stroke();
		this.app.send({'cmd':'m','y':p.y,'x':p.x});
	}else{
		var s = parseInt(this.app.uiSize.value,10);
		this.app.tctx.clearRect(0,0,1280,768);
		this.app.tctx.beginPath();
		this.app.tctx.arc(p.x,p.y,s/2.0,Math.PI*2,false);
		this.app.tctx.stroke();
	}
};
Mouse.fn.over = function(e){
	if(this.leftButtonState===true){
		var p = this.getPosition(e);
		//this.app.ctx.beginPath();
		this.app.ctx.moveTo(p.x,p.y);
	}
};


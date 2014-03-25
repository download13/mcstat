var net = require('net');

var PING = new Buffer([0xfe, 0x01]);
var PING_1_6 = new Buffer([0xfa, 0x00, 0x0b, 0, 0x4D, 0, 0x43, 0, 0x7C, 0, 0x50, 0, 0x69, 0, 0x6E, 0, 0x67, 0, 0x48, 0, 0x6F, 0, 0x73, 0, 0x74]);
var TIMEOUT = 1 * 1000;
var TRY_LIMIT = 3;
var PROTOCOL_VERSION = 73;

function ping_1_6_ext(version, addr, port) {
	binaddr = invertEndianness(Buffer(addr, 'ucs2'));
	var arr = num2arr(7 + binaddr.length, 2);
	arr.push(version);
	arr = arr.concat(num2arr(addr.length, 2));
	arr = Buffer.concat([Buffer(arr), binaddr, Buffer(num2arr(port, 4))]);
	return arr;
}

function num2arr(n, bytes) {
	var r = [];
	for(var i = bytes - 1; i >= 0; i--) {
		var p = i * 8;
		r.push((n >> p) & 255);
	}
	return r;
}

function invertEndianness(b) {
	for(var i = 0; i < b.length; i += 2) {
		var t = b[i];
		b[i] = b[i + 1];
		b[i + 1] = t;
	}
	return b;
}
function stripSpecial(s) {
	var pos;
	while((pos = s.indexOf('\xa7')) != -1) {
		s = s.substr(0, pos) + s.substr(pos + 2);
	}
	return s;
}

function validIP(addr) {
	if(typeof addr != 'string') return false;
	if(addr.match(/[^\d.]/) != null) return false;
	var segs = addr.trim().split('.');
	if(segs.length != 4) return false;
	return segs.every(function(v) {
		v = parseInt(v);
		return !isNaN(v) && v >= 0 && v < 256;
	});
}
function validDomain(addr) {
	if(typeof addr != 'string') return false;
	if(addr.match(/:/) != null) return false;
	var parts = addr.trim().split('.');
	if(parts.length < 2) return false;
	return parts.every(function(v) {
		return v.length > 0 && v[0].match(/[0-9:]/) == null;
	});
}

exports.getStatus = function(addr, port, cb, tries) {
	tries = tries || 0;
	if(tries > TRY_LIMIT) return cb(new Error('Max tries exceeded'));
	if(cb == null) {
		cb = port;
		port = 25565;
	}
	if(isNaN(port) || port > 65535 || port < 0) port = 25565;
	if(!(validIP(addr) || validDomain(addr))) return cb();
	addr = addr.trim();
	
	var conn = net.connect({host: addr, port: port}, function() {
		conn.setNoDelay(true);
		conn.write(PING);
		conn.write(PING_1_6);
		conn.write(ping_1_6_ext(PROTOCOL_VERSION, addr, port));
	});
	conn.setTimeout(TIMEOUT, function() {
		conn.destroy();
		exports.getStatus(addr, port, cb, tries + 1);
	});
	conn.on('error', function(err) {
		conn.destroy();
		cb && cb(err);
		cb = null;
	});
	conn.on('readable', function() {
		var data = conn.read();
		if(data == null) {
			return conn.destroy();
		}
		if(data[0] != 0xff) {
			conn.destroy();
			cb && cb(new Error('Kicked by server'));
			cb = null;
			return;
		}
		data = data.slice(3);
		invertEndianness(data)
		data = data.toString('ucs2');
		//console.log(data);
		data = data.split('\x00');
		if(data.length > 3) {
			data = data.slice(2);
		}
		var info = {};
		if(data.length > 3) {
			info.version = data.shift();
		}
		info.motd = data[0];
		info.players = parseInt(data[1]);
		info.slots = parseInt(data[2]);
		//console.log(info);
		
		info.motd = stripSpecial(info.motd).trim();
		
		conn.destroy();
		cb && cb(null, info);
		cb = null;
	});
}

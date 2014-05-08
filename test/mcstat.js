var assert = require('assert');
var spawn = require('child_process').spawn;
var http = require('http');
var fs = require('fs');
var path = require('path');
var async = require('async');
var mkdirp = require('mkdirp');
var mcstat = require('../mcstat');


var javaPath = process.env.PATH.split(path.delimiter).filter(function(seg) {
	return seg.toLowerCase().indexOf('java') !== -1;
})[0];
var javaBin = path.join(javaPath, 'java');

var serverProcess;
function startServer(n, done) {
	var server = servers[n];

	serverProcess = spawn(javaBin, [
		'-jar',
		server.name,
		'--nogui'
	], {cwd: path.dirname(server.name)});

	serverProcess.stdout.on('data', outHandler);
	serverProcess.stderr.on('data', outHandler);

	function outHandler(data) {
		data = data.toString();

		if(data.indexOf(' Done ') !== -1) {
			setTimeout(done, 2000);
		}
	}
}
function stopServer() {
	if(serverProcess) {
		serverProcess.kill();
		serverProcess = null;
	}
}

var servers = [
	{version: '1.3.2'},
	{version: '1.5.2'},
	{version: '1.6.4'},
	{version: '1.7.2'},
	{version: '1.7.9'}
];
servers.forEach(function(server) {
	var v = server.version;
	var v_ = v.split('.').join('_');

	server.name = path.join(__dirname, 'servers', v_, v_ + '.jar');

	server.url = 'http://s3.amazonaws.com/Minecraft.Download/versions/' + v + '/minecraft_server.' + v + '.jar';
});

function download(server, cb) {
	http.get(server.url, function(res) {
		res.on('end', function() {
			cb();
		});

		mkdirp(path.dirname(server.name), function(err) {
			if(err) {
				cb(err);
				return;
			}

			var fileStream = fs.createWriteStream(server.name);

			res.pipe(fileStream);
		});
	}).on('error', function(err) {
		cb(err);
	});
}

describe('mcstat', function() {
	before(function(done) {
		this.timeout(60000);

		var dl = servers.filter(function(server) {
			return !fs.existsSync(server.name);
		});

		async.each(dl, download, function(err) {
			if(err) throw err;

			done();
		});
	});

	describe('without server', function() {
		it('gets error from invalid domain', function(done) {
			mcstat.getStatus('testdfksjdfke34.com', 25565, function(err, r) {
				assert.equal(err.message, 'Unable to get server info: Unable to resolve domain');

				done();
			});
		});

		it('gets error from invalid IP', function(done) {
			mcstat.getStatus('458.56.21.6842', 25565, function(err, r) {
				assert.equal(err.message, 'Unable to get server info: Unable to resolve domain');

				done();
			});
		});

		it('gets error from not running server', function(done) {
			mcstat.getStatus('localhost', 2500, function(err, r) {
				assert.equal(err.message, 'Unable to get server info: Connection refused');

				done();
			});
		});

		it('gets error from not running server that is firewalled', function(done) {
			this.timeout(60000);

			mcstat.getStatus('google.com', 2500, function(err, r) {
				assert.equal(err.message, 'Unable to get server info: Timed out');

				done();
			});
		});
	});

	describe('to 1_3_2', function() {
		before(startServer.bind(null, 0));

		it('gets unknown data using 1_4', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_4'}, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		it('times out using 1_6', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_6'}, function(err, r) {
				assert.equal(err.message, 'Unable to get server info: Timed out');

				done();
			});
		});

		it('times out using 1_7', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_7'}, function(err, r) {
				assert.equal(err.message, 'Unable to get server info: Timed out');

				done();
			});
		});

		it('gets results using all', function(done) {
			mcstat.getStatus('localhost', 25565, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		after(stopServer);
	});

	describe('to 1_5_2', function() {
		before(startServer.bind(null, 1));

		it('gets results using 1_4', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_4'}, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		it('gets results using 1_6', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_6'}, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		it('times out using 1_7', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_7'}, function(err, r) {
				assert.equal(err.message, 'Unable to get server info: Timed out');

				done();
			});
		});

		it('gets results using all', function(done) {
			mcstat.getStatus('localhost', 25565, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		after(stopServer);
	});

	describe('to 1_6_4', function() {
		before(startServer.bind(null, 2));

		it('gets results using 1_4', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_4'}, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		it('gets results using 1_6', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_6'}, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		it('times out using 1_7', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_7'}, function(err, r) {
				assert.equal(err.message, 'Unable to get server info: Timed out');

				done();
			});
		});

		it('gets results using all', function(done) {
			mcstat.getStatus('localhost', 25565, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		after(stopServer);
	});

	describe('to 1_7_2', function() {
		before(startServer.bind(null, 3));

		it('gets results using 1_4', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_4'}, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		it('gets results using 1_6', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_6'}, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		it('gets results using 1_7', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_7'}, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		it('gets results using all', function(done) {
			mcstat.getStatus('localhost', 25565, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		after(stopServer);
	});

	describe('to 1_7_9', function() {
		before(startServer.bind(null, 4));

		it('gets results using 1_4', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_4'}, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		it('gets results using 1_6', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_6'}, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		it('gets results using 1_7', function(done) {
			mcstat.getStatus('localhost', 25565, {asker: '1_7'}, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		it('gets results using all', function(done) {
			mcstat.getStatus('localhost', 25565, function(err, r) {
				assert.ifError(err);

				assert.equal(r.description.text, 'A Minecraft Server');
				assert.equal(r.players.online, 0);
				assert.equal(r.players.max, 20);

				done();
			});
		});

		after(stopServer);
	});
});

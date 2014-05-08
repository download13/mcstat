var varint = require('varint');

module.exports = function(data) {
	var packetLength = varint.decode(data);
	data = data.slice(varint.decode.bytesRead);

	if(packetLength !== data.length) {
		throw new Error('Invalid packet length');
	}

	if(data[0] !== 0) {
		throw new Error('Invalid packet ID');
	}

	data = data.slice(1);

	var jsonLen = varint.decode(data);
	var jsonStart = varint.decode.bytesRead;
	var json = data.toString('utf8', jsonStart, jsonStart + jsonLen);

	var r = JSON.parse(json);

	if(typeof r.description === 'string') {
		r.description = {text: r.description};
	}

	return r;
}

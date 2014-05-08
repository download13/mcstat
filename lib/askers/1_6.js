var invertEndianness = require('../util').invertEndianness;

var PACKET_HEAD = new Buffer([
	0xfe, // Packet ID
	1, // Ping
	0xfa, // Plugin message
	0, 11, // Length of string
	// UTF-16BE string "MC|PingHost"
	0, 0x4D, 0, 0x43, 0, 0x7C, 0, 0x50, 0, 0x69, 0, 0x6E, 0, 0x67, 0, 0x48, 0, 0x6F, 0, 0x73, 0, 0x74
]);
var PACKET_VERSION = new Buffer([74]);
var PAYLOAD_LENGTH = new Buffer(2);
var ADDR_LENGTH = new Buffer(2);
var PACKET_PORT = new Buffer(4);


module.exports = function(conn, addr, port) {
	addr = new Buffer(addr, 'utf16le');
	invertEndianness(addr); // Change to UTF-16BE

	var payloadLen = 1 + 2 + addr.length + 4;
	PAYLOAD_LENGTH.writeInt16BE(payloadLen, 0);

	ADDR_LENGTH.writeInt16BE(addr.length / 2, 0);

	PACKET_PORT.writeInt32BE(port, 0);

	var packet = Buffer.concat([
		PACKET_HEAD,
		PAYLOAD_LENGTH,
		PACKET_VERSION,
		ADDR_LENGTH,
		addr,
		PACKET_PORT
	], PACKET_HEAD.length + 2 + payloadLen);

	conn.write(packet);
}

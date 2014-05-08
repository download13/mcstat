var varint = require('varint');

var PACKET_HEAD = new Buffer([
	0, // Packet ID 0
	4 // Version 4 (1.7.2), 5 is 1.7.6
]);
var PACKET_PORT = new Buffer(2);
var PACKET_NEXTSTATE = new Buffer([1]);
var PACKET_STATUS_REQ = new Buffer([1, 0]);


module.exports = function(conn, addr, port) {
	addr = new Buffer(addr);
	var addrLen = new Buffer(varint.encode(addr.length));

	PACKET_PORT.writeUInt16BE(port, 0);

	var packetLength = 2 + addrLen.length + addr.length + 2 + 1;
	var lengthBuffer = new Buffer(varint.encode(packetLength));

	var packet = Buffer.concat([
		lengthBuffer,
		PACKET_HEAD,
		addrLen,
		addr,
		PACKET_PORT,
		PACKET_NEXTSTATE,
		PACKET_STATUS_REQ
	], packetLength + 3);

	conn.write(packet);
}

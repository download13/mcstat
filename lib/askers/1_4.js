var PACKET = new Buffer([0xfe, 1]);

module.exports = function(conn, addr, port) {
	conn.write(PACKET);
}

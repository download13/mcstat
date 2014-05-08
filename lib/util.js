function invertEndianness(b) {
	for(var i = 0; i < b.length; i += 2) {
		var t = b[i];
		b[i] = b[i + 1];
		b[i + 1] = t;
	}
	return b;
}

exports.invertEndianness = invertEndianness;

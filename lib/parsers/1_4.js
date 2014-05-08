var invertEndianness = require('../util').invertEndianness;

module.exports = function(data) {
	if(data[0] !== 0xff) {
		throw new Error('Invalid packet ID');
	}

	var str = data.slice(9);
	invertEndianness(str);
	str = str.toString('utf16le');
	var items = str.split('\0');

	if(items.length !== 5) {
		throw new Error('Unrecognized response: ' + str);
	}

	return {
		description: {text: items[2]},
		players: {online: parseInt(items[3]), max: parseInt(items[4])},
		version: {name: items[1]}
	};
}

var invertEndianness = require('../util').invertEndianness;

module.exports = function(data) {
	if(data[0] !== 0xff) {
		throw new Error('Invalid packet ID');
	}

	var str = data.slice(3);
	invertEndianness(str);
	str = str.toString('utf16le');
	var items = str.split('\xa7');

	if(items.length !== 3) {
		throw new Error('Unrecognized response: ' + str);
	}

	return {
		description: {text: items[0]},
		players: {max: parseInt(items[2]), online: parseInt(items[1])},
		version: {name: '1.3.x'}
	};
}

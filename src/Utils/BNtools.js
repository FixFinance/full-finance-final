function BNmin(a, b) {
	return a.lt(b) ? a : b;
}

function BNmax(a, b) {
	return a.gt(b) ? a : b;
}

module.exports = {
	BNmin,
	BNmax
}
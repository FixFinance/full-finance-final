function BNmin(a, b) {
	if (a == null && b != null) return b;
	if (b == null && a != null) return a;
	if (a == null && b == null) return null;
	return a.lt(b) ? a : b;
}

function BNmax(a, b) {
	if (a == null && b != null) return b;
	if (b == null && a != null) return a;
	if (a == null && b == null) return null;
	return a.gt(b) ? a : b;
}

module.exports = {
	BNmin,
	BNmax
}
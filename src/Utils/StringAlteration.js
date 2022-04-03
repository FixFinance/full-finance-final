export function filterInput(str) {
	let ret = '';
	let usedDecimal = false;
	for (let i = 0; i < str.length; i++) {
		let char = str.charAt(i);
		if ('0' <= char && char <= '9') {
			ret += char;
		}
		else if (char === '.') {
			if (!usedDecimal) {
				ret += char;
				usedDecimal = true;
			}
		}
	}
	return ret;
}

export function getDecimalString(bn, decimals, maxDecimalsShown=decimals) {
	var ret;
	if (bn.length <= decimals) ret = "0."+'0'.repeat(decimals-bn.length)+bn;
	else ret = bn.substring(0, bn.length-decimals)+'.'+bn.substring(bn.length-decimals, bn.length-decimals);
	//remove trailing 0s
	for (var i = ret.length-1; ret[i] === '0'; ret = ret.substring(0,i), i=ret.length-1){}
	if (ret[ret.length-1]==='.')ret = ret.substring(0,ret.length-1);
	let halves = ret.split('.');
	if (halves.length == 2) ret = halves[0]+'.'+halves[1].substring(0, maxDecimalsShown)
	return ret;
}

export function getAbsoluteString(str, decimals) {
	var halves = str.split('.');
	if (halves.length > 2) throw new Error('invalid string');
	var ret: string;
	if (halves.length === 1) ret = halves[0]+'0'.repeat(decimals);
	else if (halves[1].length <= decimals) ret = halves[0]+halves[1]+'0'.repeat(decimals-halves[1].length);
	else ret = halves[0]+halves[1].substring(0, decimals);
	var counter = 0;
	for(;counter<ret.length&&ret[counter]==='0';counter++){}
	ret = ret.substring(counter);
	if (ret === "") ret = "0";
	return ret;
}
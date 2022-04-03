function getArgString(arg) {
	console.log(arg);
	return arg.type+(arg.indexed ? ' indexed ' : ' ')+arg.name;
}

function getArgArrayString(args) {
	let ret = '';
	for (let i = 0; i < args.length-1; i++) {
		ret += getArgString(args[i])+', ';
	}
	if (args.length > 0) {
		ret += getArgString(args[args.length-1]);
	}
	return ret;
}

export function GetHumanReadableABI(abi) {
	let ret = new Array(abi);
	for (let i = 0; i < abi.length; i++) {
		let frag = abi[i];

		let fragString = frag.type+' '+frag.name+' ('+getArgArrayString(frag.inputs)+')';

		if (frag.type === 'function') {
			let smString = ' '+(frag.stateMutability !== 'nonpayable' ? frag.stateMutability : '');
			let outputsString = frag.outputs.length > 0 ? ` returns (${getArgArrayString(frag.outputs)})` : '';
			fragString += smString+outputsString;
		}

		ret[i] = fragString;
	}
	return ret;
}
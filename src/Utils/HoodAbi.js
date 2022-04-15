import { ethers } from 'ethers';
const BN = ethers.BigNumber;
const _0 = BN.from(0);

const BYTES_PER_WORD = 32;
const HEX_CHARS_PER_BYTE = 2;
const HEX_CHARS_PER_WORD = BYTES_PER_WORD * HEX_CHARS_PER_BYTE;

export function getFunctionSelector(contractInstance, functionName) {
	let propNames = Object.getOwnPropertyNames(contractInstance.functions);
	let strToHash = "";
	for (let i = 0; i < propNames.length && strToHash === ""; i++) {
		let prop = propNames[i];
		if (prop.substring(0, functionName.length) === functionName && prop.length > functionName.length) {
			strToHash = prop;
		}
	}
	let bytes = ethers.utils.toUtf8Bytes(strToHash);
	let hash = ethers.utils.keccak256(bytes);
	return hash.substring(0, 10);
}

function isAddressString(str) {
	if (typeof(str) !== 'string') {
		throw "isAddressString() expected a string to be passed";
	}
	return str.length === 42 && str.substring(0,2) === '0x';
}

function addressToWord(addrString) {
	if (!isAddressString(addrString)) {
		throw addrString+" is not a valid address string";
	}
	return "0".repeat(24) + addrString.substring(2);
}

function numToWord(num) {
	if (typeof(num) !== 'string' && typeof(num) !== 'number') {
		throw "numToWord() expected a string or number string to be passed";
	}
	let bn = BN.from(num);
	if (bn.lt(_0)) {
		throw "negative numbers not supported by numToWord()";
	}
	let hexStr = bn.toHexString().substring(2);
	if (hexStr.length > HEX_CHARS_PER_WORD) {
		throw "cannot encode number greater than 2**256 - 1";
	}
	return "0".repeat(HEX_CHARS_PER_WORD-hexStr.length) + hexStr;
}

function processArray(arr) {
	if (!Array.isArray(arr)) {
		throw "processArray() expected an array";
	}
	let str = numToWord(arr.length.toString());
	for (let i = 0; i < arr.length; i++) {
		str += processArg(arr[i], false, i !== 0);
	}
	return str;
}

function processObject(obj) {
	if (Array.isArray(obj)) {
		return processArray(obj);
	}
	if (typeof(obj) !== 'object') {
		throw "processObject() expected an object";
	}
	let paramOrder = obj.paramOrder;
	let str = '';
	let bytesWritten = 0;
	for (let i = 0; i < paramOrder.length; i++) {
		let encodedArg = processArg(obj[paramOrder[i]], bytesWritten, i !== 0);
		if (encodedArg.length % HEX_CHARS_PER_WORD !== 0) {
			throw "encoded hex string was of uneven length";
		}
		str += encodedArg;
		let newBytes = encodedArg.length/HEX_CHARS_PER_BYTE;
		bytesWritten += newBytes;
	}
	return str;
}

function processArg(arg, bytesWritten, writePtr) {
	if (typeof(arg) === 'object') {
		if (writePtr) {
			return numToWord(bytesWritten + BYTES_PER_WORD) + processObject(arg);
		}
		return processObject(arg);
	}
	else if (typeof(arg) === 'boolean') {
		return numToWord(arg ? 1 : 0);
	}
	else if (typeof(arg) === 'string' && isAddressString(arg)) {
		return addressToWord(arg);
	}
	else {
		return numToWord(arg);
	}
}

function argContainsObj(arg) {
	if (typeof(arg) !== 'object') {
		return false;
	}
	let paramOrder = arg.paramOrder;
	for (let i = 0; i < paramOrder.length; i++) {
		let param = paramOrder[i];
		if (typeof(arg[param]) === 'object') {
			return true;
		}
	}
	return false;
}

function encodeAllParentArgs(args, bytesWritten=0) {
	let data = '';
	for (let i = 0; i < args.length; i++) {
		let encodedArg = processArg(args[i], bytesWritten, argContainsObj(args[i]));
		if (encodedArg.length % HEX_CHARS_PER_WORD !== 0) {
			throw "encoded hex string was of uneven length";
		}
		data += encodedArg;
		let newBytes = encodedArg.length/HEX_CHARS_PER_BYTE;
		bytesWritten += newBytes;
	}
	return data;
}

export function hoodEncodeABI(contract, fName, args) {
	let selector = getFunctionSelector(contract, fName);
	return selector + encodeAllParentArgs(args);
}

export function hoodEncodeABI_Deploy(ContractType, args) {
	let bytecode = ContractType.bytecode;
	let bytesWritten = (bytecode.length-2)/HEX_CHARS_PER_BYTE;
	return bytecode + encodeAllParentArgs(args, bytesWritten);
}
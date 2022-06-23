import { hoodEncodeABI } from './HoodAbi.js';

const DEFAULT_CALLBACK = () => false;

export async function getNonce(provider, userAddress) {
	return await provider.getTransactionCount(userAddress);
}

export async function BroadcastTx(signer, tx, callback0, callback1) {
	console.log('Tx Initiated');
	let rec = await signer.sendTransaction(tx);
	console.log('Tx Sent', rec);

	console.log('Calling Callback0');
	await callback0();
	console.log('Callback0 Complete');

	let resolvedRec = await rec.wait();
	console.log('Tx Resolved, resolvedRec');

	console.log('Calling Callback1');
	await callback1();
	console.log('Callback1 Complete');

	return { rec, resolvedRec };
}
/*
export async function SendTx(userAddress, contractInstance, functionName, argArray, overrides={}, callback0=DEFAULT_CALLBACK, callback1=DEFAULT_CALLBACK) {
	if (contractInstance == null) {
		throw "SendTx2 Attempted to Accept Null Contract";
	}

	const signer = contractInstance.signer;

	let tx = {
		to: contractInstance.address,
		from: userAddress,
		data: hoodEncodeABI(contractInstance, functionName, argArray),
		nonce: await getNonce(signer.provider, userAddress),
		gasLimit: (await contractInstance.estimateGas[functionName](...argArray)).toNumber() * 2,
		...overrides
	}

	let { resolvedRec } = await BroadcastTx(signer, tx, callback0, callback1);

	return resolvedRec;

}
*/

export function getSendTx(callback0=DEFAULT_CALLBACK, callback1=DEFAULT_CALLBACK) {
	return async function(userAddress, contractInstance, functionName, argArray, overrides={}) {
		if (contractInstance == null) {
			throw "SendTx2 Attempted to Accept Null Contract";
		}

		const signer = contractInstance.signer;

		let tx = {
			to: contractInstance.address,
			from: userAddress,
			data: hoodEncodeABI(contractInstance, functionName, argArray),
			nonce: await getNonce(signer.provider, userAddress),
			gasLimit: (await contractInstance.estimateGas[functionName](...argArray)).toNumber() * 2,
			...overrides
		}

		let { resolvedRec } = await BroadcastTx(signer, tx, callback0, callback1);

		return resolvedRec;

	}
}

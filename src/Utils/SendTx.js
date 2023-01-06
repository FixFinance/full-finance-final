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

export function getSendTx(callback0=DEFAULT_CALLBACK, callback1=DEFAULT_CALLBACK) {
	return async function(userAddress, contractInstance, functionName, argArray, overrides={}, cb0=callback0, cb1=callback1) {
		if (contractInstance == null) {
			throw Error("SendTx2 Attempted to Accept Null Contract");
		}

		const signer = contractInstance.signer;

		let tx = await contractInstance.populateTransaction[functionName](...argArray);

		let info = {
			nonce: await getNonce(signer.provider, userAddress),
			gasLimit: Math.floor((await contractInstance.estimateGas[functionName](...argArray)).toNumber() * 1.125),
			...overrides
		}
		tx = {...info, ...tx};

		let { resolvedRec } = await BroadcastTx(signer, tx, cb0, cb1);

		return resolvedRec;

	}
}

import { hoodEncodeABI } from './HoodAbi.js';

export let sentState = false;

async function getNonce(provider, userAddress) {
	return await provider.getTransactionCount(userAddress);
}

async function broadcastTx(signer, tx) {

	console.log('Tx Initiated');
	let rec = await signer.sendTransaction(tx);
	console.log('Tx Sent', rec);
	sentState = true;
	let resolvedRec = await rec.wait();
	console.log('Tx Resolved, resolvedRec');
	sentState = false;
	return { rec, resolvedRec };
}

export async function SendTx(userAddress, contractInstance, functionName, argArray, overrides={}) {
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

	let { resolvedRec } = await broadcastTx(signer, tx);

	return resolvedRec;

}

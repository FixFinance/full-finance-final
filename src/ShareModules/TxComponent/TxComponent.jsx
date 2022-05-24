import { hoodEncodeABI } from '../../Utils/HoodAbi';
import useState from 'react';

export const TxComponent = ({ functionMessage,  userAddress, contractInstance, functionName, argArray}) => {

	const [sentState, setSentState] = useState(false);

	async function getNonce(provider, userAddress) {
		return await provider.getTransactionCount(userAddress);
	}

	async function broadcastTx(signer, tx) {

		console.log('Tx Initiated');
		let rec = await signer.sendTransaction(tx);
		console.log('Tx Sent', rec);
		setSentState(true);
		let resolvedRec = await rec.wait();
		console.log('Tx Resolved, resolvedRec');
		setSentState(false);
		return { rec, resolvedRec };
	}

	async function SendTx(userAddress, contractInstance, functionName, argArray, overrides={}) {
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

	async function callTx(userAddress, contractInstance, functionName, argArray, overrides={}) {
		await SendTx(userAddress, contractInstance, functionName, argArray, overrides={})
		return;
	}

	const LoadingContents = sentState ? functionMessage : 'Waiting For Confirmation';

	return (
		<button
			className="btn btn-deactive"
			onClick={() => callTx(userAddress, contractInstance, functionName, argArray)}
			>
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			<span className="ms-3">{LoadingContents}</span>
		</button>
	);
}
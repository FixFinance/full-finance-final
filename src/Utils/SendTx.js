export async function SendTx(tx) {
	let rec = await tx;
	let conf = await rec.wait();
	console.log('confirmation', conf);
	return [rec, conf]
}
import { BigNumber as BN } from 'ethers';
import { _0 } from './Consts';

export function neg(a) {
	return _0.sub(a);
}

export function abs(a) {
	return a.gte(_0) ? a : neg(a);
}

export function BNmin(a, b) {
	if (a == null && b != null) return b;
	if (b == null && a != null) return a;
	if (a == null && b == null) return null;
	return a.lt(b) ? a : b;
}

export function BNmax(a, b) {
	if (a == null && b != null) return b;
	if (b == null && a != null) return a;
	if (a == null && b == null) return null;
	return a.gt(b) ? a : b;
}
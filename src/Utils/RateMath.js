import { BigNumber as BN } from 'ethers';

export const BLOCKS_PER_YEAR = 2381654;

export const TOTAL_SBPS = BN.from(10).pow(BN.from(18));

export function getAnnualizedRate(blockRate) {
	let current = blockRate;
	let ret = TOTAL_SBPS;
	for (let exp = 1; exp <= BLOCKS_PER_YEAR; exp<<=1) {
		if ((exp & BLOCKS_PER_YEAR) > 0) {
			ret = ret.mul(current).div(TOTAL_SBPS);
		}
		current = current.mul(current).div(TOTAL_SBPS);
	}
	return ret;
}
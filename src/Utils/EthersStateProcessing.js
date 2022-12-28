import { BigNumber as BN } from 'ethers';
import { _0, _1, _2 } from './Consts.js';
import { getDecimalString } from './StringAlteration';

const ENV_ASSET_DECIMALS = JSON.parse(process.env.REACT_APP_ASSET_DECIMALS);
const ENV_AGG_DECIMALS = JSON.parse(process.env.REACT_APP_AGGREGATOR_DECIMALS);
const ENV_ASSET_INF_BITS = JSON.parse(process.env.REACT_APP_ASSET_INF_BITS);

export function getFLTUnderlyingValue(fltBals, irmInfo, envIndex) {
	if (fltBals === null || irmInfo === null) return _0;
	return fltBals[envIndex].mul(irmInfo[envIndex].supplyLent).div(irmInfo[envIndex].supplyLendShares);
}

export function getFLTUnderlyingValueString(fltBals, irmInfo, envIndex) {
	let val = getFLTUnderlyingValue(fltBals, irmInfo, envIndex);
	return getDecimalString(val.toString(), ENV_ASSET_DECIMALS[envIndex], 2);
}

/*
	@Return USD value with 18 decimals
*/
export function getFLTUSDValue(fltBals, irmInfo, aggInfo, envIndex) {
	if (fltBals === null || irmInfo === null || aggInfo === null) return _0;
	let underlying = getFLTUnderlyingValue(fltBals, irmInfo, envIndex);
	let aggDecimals = ENV_AGG_DECIMALS[envIndex];
	let assetDecimals = ENV_ASSET_DECIMALS[envIndex];
	let decimalsToInflate = 18-assetDecimals-aggDecimals;
	let decimalsScalar = BN.from(10).pow(BN.from(Math.abs(decimalsToInflate)));
	return underlying.mul(aggInfo[envIndex])[decimalsToInflate > 0 ? 'mul' : 'div'](decimalsScalar);
}

export function getFLTUSDValueString(fltBals, irmInfo, aggInfo, envIndex) {
	let val = getFLTUSDValue(fltBals, irmInfo, aggInfo, envIndex);
	return getDecimalString(val.toString(), 18, 2);
}

export function getAssetBalanceString(assetBals, envIndex, maxDecimalsShown=4) {
	if (assetBals === null) return '0';
	return getDecimalString(assetBals[envIndex].toString(), ENV_ASSET_DECIMALS[envIndex], maxDecimalsShown);
}

export function getFLTBalanceString(fltBals, envIndex, maxDecimalsShown=4) {
	if (fltBals === null) return '0';
	return getDecimalString(fltBals[envIndex].toString(), ENV_ASSET_DECIMALS[envIndex], maxDecimalsShown);
}

export function getAssetInfApprovalAmount(envIndex) {
	_2.pow(BN.from(ENV_ASSET_INF_BITS[envIndex])).sub(_1);
}

export function getProtocolUSDVanityMetrics(irmInfo, aggInfo) {
	let totalLendValue = _0;
	let totalBorrowValue = _0;
	if (irmInfo !== null && aggInfo !== null) {
		for (let i = 0; i < irmInfo.length; i++) {
			let decimalsToInflate = 18-ENV_ASSET_DECIMALS[i]-ENV_AGG_DECIMALS[i];
			let decimalsScalar = BN.from(10).pow(BN.from(Math.abs(decimalsToInflate)));
			let lendValue = irmInfo[i].supplyLent.mul(aggInfo[i])
				[decimalsToInflate > 0 ? 'mul' : 'div'](decimalsScalar);
			let borrowValue = irmInfo[i].supplyBorrowed.mul(aggInfo[i])
				[decimalsToInflate > 0 ? 'mul' : 'div'](decimalsScalar);
			totalLendValue = totalLendValue.add(lendValue);
			totalBorrowValue = totalBorrowValue.add(borrowValue);
		}
	}
	return { totalLendValue, totalBorrowValue };
}

export function getProtocolUSDVanityMetricsStrings(irmInfo, aggInfo) {
	let { totalLendValue, totalBorrowValue } = getProtocolUSDVanityMetrics(irmInfo, aggInfo);
	let totalLendValueString = getDecimalString(totalLendValue.toString(), 18, 2);
	let totalBorrowValueString = getDecimalString(totalBorrowValue.toString(), 18, 2);
	return { totalLendValueString, totalBorrowValueString };
}
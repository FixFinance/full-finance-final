import { BigNumber as BN } from 'ethers';
import {
	_0, _1, _2, TOTAL_SBPS, INF, INF_CHAR,
	GOOD_COLLAT_RATIO_MULTIPLIER
} from './Consts.js';
import { getDecimalString } from './StringAlteration';

const ENV_ASSETS = JSON.parse(process.env.REACT_APP_LISTED_ASSETS);
const ENV_ASSET_DECIMALS = JSON.parse(process.env.REACT_APP_ASSET_DECIMALS);
const ENV_AGG_DECIMALS = JSON.parse(process.env.REACT_APP_AGGREGATOR_DECIMALS);
const ENV_ASSET_INF_BITS = JSON.parse(process.env.REACT_APP_ASSET_INF_BITS);
const ENV_LTVS = JSON.parse(process.env.REACT_APP_LTVS);
const ENV_BFACS = JSON.parse(process.env.REACT_APP_BFACS);

function getUSDValue(amount, aggInfo, envIndex) {
	let aggDecimals = ENV_AGG_DECIMALS[envIndex];
	let assetDecimals = ENV_ASSET_DECIMALS[envIndex];
	let decimalsToInflate = 18-aggDecimals-assetDecimals;
	let decimalsScalar = BN.from(10).pow(Math.abs(decimalsToInflate));
	return amount.mul(aggInfo[envIndex])[decimalsToInflate > 0 ? 'mul':'div'](decimalsScalar);
}

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

export function getAssetInfoFromVault(vault, irmInfo, aggInfo, envIndex) {
	let asset = ENV_ASSETS[envIndex];
	let indSupplied = vault.collateralAssets.indexOf(asset);
	let indBorrowed = vault.debtAssets.indexOf(asset);
	let isSupplied = indSupplied !== -1;
	let isBorrowed = indBorrowed !== -1;
	let suppliedUnderlying = _0;
	let borrowedUnderlying = _0;
	let suppliedUSDValue = _0;
	let borrowedUSDValue = _0;
	let adjSuppliedUSDValue = _0;
	let adjBorrowedUSDValue = _0;
	let suppliedUnderlyingString = '0';
	let borrowedUnderlyingString = '0';
	let suppliedUSDValueString = '0';
	let borrowedUSDValueString = '0';
	if (isSupplied || isBorrowed) {
		const USDDecimals = 18;
		let decimalsToInflate = USDDecimals-ENV_ASSET_DECIMALS[envIndex]-ENV_AGG_DECIMALS[envIndex];
		let decimalsScalar = BN.from(10).pow(BN.from(Math.abs(decimalsToInflate)));
		if (isSupplied) {
			suppliedUnderlying = vault.collateralLendShareAmounts[indSupplied].mul(irmInfo[envIndex].supplyLent).div(irmInfo[envIndex].supplyLendShares);
			suppliedUSDValue = suppliedUnderlying.mul(aggInfo[envIndex])
				[decimalsToInflate > 0 ? 'mul' : 'div'](decimalsScalar);
			adjSuppliedUSDValue = suppliedUSDValue.mul(BN.from(ENV_LTVS[envIndex])).div(BN.from(100));
			suppliedUnderlyingString = getDecimalString(suppliedUnderlying.toString(), ENV_ASSET_DECIMALS[envIndex], 4);
			suppliedUSDValueString = getDecimalString(suppliedUSDValue.toString(), USDDecimals, 2);
		}
		if (isBorrowed) {
			borrowedUnderlying = vault.debtShareAmounts[indBorrowed].mul(irmInfo[envIndex].supplyBorrowed).div(irmInfo[envIndex].supplyBorrowShares);
			borrowedUSDValue = borrowedUnderlying.mul(aggInfo[envIndex])
				[decimalsToInflate > 0 ? 'mul' : 'div'](decimalsScalar);
			adjBorrowedUSDValue = borrowedUSDValue.mul(BN.from(ENV_BFACS[envIndex])).div(BN.from(100));
			borrowedUnderlyingString = getDecimalString(borrowedUnderlying.toString(), ENV_ASSET_DECIMALS[envIndex], 4);
			borrowedUSDValueString = getDecimalString(borrowedUSDValue.toString(), USDDecimals, 2);
		}
	}

	return {
      isSupplied, suppliedUnderlying, suppliedUSDValue, adjSuppliedUSDValue, suppliedUnderlyingString, suppliedUSDValueString,
      isBorrowed, borrowedUnderlying, borrowedUSDValue, adjBorrowedUSDValue, borrowedUnderlyingString, borrowedUSDValueString
	};
}

export function getAssetInfoFromVaultDetails(vaultDetails, envIndex) {
	if (vaultDetails === null) {
		return {
			isSupplied: false,
			isBorrowed: false,
			suppliedUnderlyingString: '0',
			borrowedUnderlyingString: '0',
			suppliedUSDValueString: '0',
			borrowedUSDValueString: '0'
		};
	}
	return vaultDetails[ENV_ASSETS[envIndex]];
}


export function getImplCollatRatioStrings(vaultDetails, aggInfo, isDebt, changeUnderlying, envIndex) {
	let implEffCollatRatioString = '0';
	let implReqCollatRatioString = '0';

	if (![vaultDetails, aggInfo].includes(null)) {
		let valueChange = getUSDValue(changeUnderlying, aggInfo, envIndex);
		let adjValueChange = valueChange.mul(BN.from((isDebt ? ENV_BFACS : ENV_LTVS)[envIndex])).div(BN.from(100));

		let {
			totalSuppliedUSDValue,
			totalBorrowedUSDValue,
			totalAdjSuppliedUSDValue,
			totalAdjBorrowedUSDValue
		} = vaultDetails;

		if (isDebt) {
			totalBorrowedUSDValue = totalBorrowedUSDValue.add(valueChange);
			totalAdjBorrowedUSDValue = totalAdjBorrowedUSDValue.add(adjValueChange);
		}
		else {
			totalSuppliedUSDValue = totalSuppliedUSDValue.add(valueChange);
			totalAdjSuppliedUSDValue = totalAdjSuppliedUSDValue.add(adjValueChange);
		}

		let effCollatRatio = totalBorrowedUSDValue.lte(_0) ? INF : totalSuppliedUSDValue.mul(TOTAL_SBPS).div(totalBorrowedUSDValue);
		let adjCollatRatio = totalAdjBorrowedUSDValue.lte(_0) ? INF : totalAdjSuppliedUSDValue.mul(TOTAL_SBPS).div(totalAdjBorrowedUSDValue);
		let reqCollatRatio = TOTAL_SBPS;
		if (!totalSuppliedUSDValue.eq(_0) && !totalBorrowedUSDValue.eq(_0)) {
			let aggregateCollatLTV = totalAdjSuppliedUSDValue.mul(TOTAL_SBPS).div(totalSuppliedUSDValue);
			let aggregateDebtBFac  = totalAdjBorrowedUSDValue.mul(TOTAL_SBPS).div(totalBorrowedUSDValue);
			reqCollatRatio = aggregateDebtBFac.mul(TOTAL_SBPS).div(aggregateCollatLTV);
		}
		
		implEffCollatRatioString = effCollatRatio.gte(INF) ? INF_CHAR : getDecimalString(effCollatRatio.toString(), 16, 2);
		implReqCollatRatioString = getDecimalString(reqCollatRatio.toString(), 16, 2);

	}

	return {
		implEffCollatRatioString,
		implReqCollatRatioString
	};
}

export function isGoodCollatRatio(effCollatRatioString, requiredCollatRatioString) {
	return effCollatRatioString === INF_CHAR || parseFloat(effCollatRatioString)-1 > (parseFloat(requiredCollatRatioString)-1) * GOOD_COLLAT_RATIO_MULTIPLIER;
}
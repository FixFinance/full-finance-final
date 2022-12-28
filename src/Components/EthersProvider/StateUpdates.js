import { ethers, BigNumber as BN } from 'ethers';
import { ADDRESS0, TOTAL_SBPS, _0, INF, INF_CHAR } from '../../Utils/Consts.js';
import { getDecimalString } from '../../Utils/StringAlteration';

import { getAssetInfoFromVault } from '../../Utils/EthersStateProcessing';

const IMetaMoneyMarketABI = require('../../abi/IMetaMoneyMarket.json');
const IFullLendTokenABI = require('../../abi/IFullLendToken.json');
const IERC20ABI = require('../../abi/IERC20.json');
const IChainlinkAggregatorABI = require('../../abi/IChainlinkAggregator.json');
const IInterestRateModelABI = require('../../abi/IInterestRateModel.json');

const ENV_ASSETS = JSON.parse(process.env.REACT_APP_LISTED_ASSETS);

//------------P-R-I-M-A-R-Y---S-T-A-T-E---U-P-D-A-T-E-R-S------------------
/* @PRIMARY
 * All primary state functions are passed (provider, userAddress, setState)
 * Primary state functions are remote resource intensive, mostly make calls to blockchain endpoints
 * 
 */

/*
    @Primary State Function
        @state: vault
*/
export function updateVault(provider, userAddress, setState) {
    const MMM = new ethers.Contract(process.env.REACT_APP_MMM_ADDRESS, IMetaMoneyMarketABI, provider);
    return MMM.getConnectedVault(userAddress)
        .then(res => {setState(res); return res});
}

/*
    @Primary State Function
        @state: fltBals
*/
export function updateFLTbals(provider, userAddress, setState) {
    let FLTs = JSON.parse(process.env.REACT_APP_FLTS)
        .map(x => new ethers.Contract(x, IFullLendTokenABI, provider));
    let ret = new Array(FLTs.length); ret.fill(_0);
    return Promise.all(FLTs.map((x, i) => getFLTbal(ret, i, x, userAddress)))
        .then(() => {setState(ret); return ret;});
}

/*
    @Primary State Function
        @state: irmInfo
*/
export function updateIRMInfo(provider, userAddress, setState) {
    let IRMs = JSON.parse(process.env.REACT_APP_IRMS)
        .map(x => new ethers.Contract(x, IInterestRateModelABI, provider));
    let ret = IRMs.map(() => ({
        supplyLent: _0,
        supplyBorrowed: _0,
        supplyLendShares: _0,
        supplyBorrowShares: _0,
        annualLendRateString: '0',
        annualBorrowRateString: '0',
    }));
    return Promise.all(IRMs.map((x, i) => getIRMInfo(ret, i, x)))
        .then(() => {setState(ret); return ret;});
}

/*
    @Primary State Function
        @state: aggInfo
*/
export function updateAggInfo(provider, userAddress, setState) {
    let Aggs = JSON.parse(process.env.REACT_APP_AGGREGATORS)
        .map(x => new ethers.Contract(x, IChainlinkAggregatorABI, provider));
    let ret = new Array(Aggs.length); ret.fill(_0);
    return Promise.all(Aggs.map( (x, i) => x.latestAnswer().then(res => ret[i] = res) ))
        .then(() => {setState(ret); return ret;});
}

/*
    @Primary State Function
        @state: assetBals
*/
export function updateAssetBals(provider, userAddress, setState) {
    let ASSETS = JSON.parse(process.env.REACT_APP_LISTED_ASSETS)
        .map(x => new ethers.Contract(x, IERC20ABI, provider));
    let ret = ASSETS.map(() => _0);
    return Promise.all(ASSETS.map( (x, i) => x.balanceOf(userAddress).then(res => ret[i] = res) ))
        .then(() => {setState(ret); return ret;});
}

/*
    @Primary State Function
        @state: assetAllowances
*/
export function updateAssetAllowances(provider, userAddress, setState) {
    let ASSETS = JSON.parse(process.env.REACT_APP_LISTED_ASSETS)
        .map(x => new ethers.Contract(x, IERC20ABI, provider));
    let ESCROW_ADDRESSES = JSON.parse(process.env.REACT_APP_ESCROWS);
    let ret = ASSETS.map(() => _0);
    return Promise.all(ASSETS.map( (x, i) => x.allowance(userAddress, ESCROW_ADDRESSES[i]).then(res => ret[i] = res) ))
        .then(() => {setState(ret); return ret;});
}

//------------P-R-I-M-A-R-Y---S-T-A-T-E---H-E-L-P-E-R-S------------------
/*
    @helps: updateFLTbals()
*/
function getFLTbal(arr, index, flt, userAddress) {
    if (flt === null) return;
    return flt.balanceOf(userAddress).then(res => {
        arr[index] = res;
    }).catch(err => {
        console.error(err);
    });
}
/*
    @helps: updateIRMInfo()
*/
function getIRMInfo(arr, index, irm) {
    return Promise.all([
        irm.getLendAPY().then(x => arr[index].annualLendRateString = getDecimalString(x.sub(TOTAL_SBPS).toString(), 16, 3)),
        irm.getBorrowAPY().then(x => arr[index].annualBorrowRateString = getDecimalString(x.sub(TOTAL_SBPS).toString(), 16, 3)),
        irm.getSupplyLent().then(x => arr[index].supplyLent = x),
        irm.getSupplyBorrowed().then(x => arr[index].supplyBorrowed = x),
        irm.getSupplyLendShares().then(x => arr[index].supplyLendShares = x),
        irm.getSupplyBorrowShares().then(x => arr[index].supplyBorrowShares = x)
    ]);
}

//------------S-E-C-O-N-D-A-R-Y---S-T-A-T-E---U-P-D-A-T-E-R-S------------------
/* @SECONDARY
 * All secondary state functions are passed (effectivePrimaryState) and return the new state which shall be set
 * Secondary state functions are compute intensive, calls are triggered by some change in primary state
 * 
 */

/*
    @Secondary State Function
        @state updated: secondary::vaultDetails
        @state utilised: primary::{vault, aggInfo, irmInfo}
*/
export function updateVaultDetails(effectivePrimaryState, setState) {
    const { vault, irmInfo, aggInfo } = effectivePrimaryState;
    if ([vault, irmInfo, aggInfo].includes(null)) {
        return null;
    }
    let totalSuppliedUSDValue = _0;
    let totalBorrowedUSDValue = _0;
    let totalAdjSuppliedUSDValue = _0;
    let totalAdjBorrowedUSDValue = _0;
    let vaultDetails = {};
    for (let i = 0; i < ENV_ASSETS.length; i++) {
        let assetInfo = getAssetInfoFromVault(vault, irmInfo, aggInfo, i);
        vaultDetails[ENV_ASSETS[i]] = assetInfo;
        totalSuppliedUSDValue = totalSuppliedUSDValue.add(assetInfo.suppliedUSDValue);
        totalBorrowedUSDValue = totalBorrowedUSDValue.add(assetInfo.borrowedUSDValue);
        totalAdjSuppliedUSDValue = totalAdjSuppliedUSDValue.add(assetInfo.adjSuppliedUSDValue);
        totalAdjBorrowedUSDValue = totalAdjBorrowedUSDValue.add(assetInfo.adjBorrowedUSDValue);
    }
    let effCollateralizationRatio = totalBorrowedUSDValue.eq(_0) ? INF : totalSuppliedUSDValue.mul(TOTAL_SBPS).div(totalBorrowedUSDValue);
    let adjCollateralizationRatio = totalAdjBorrowedUSDValue.eq(_0) ? INF : totalAdjSuppliedUSDValue.mul(TOTAL_SBPS).div(totalAdjBorrowedUSDValue);
    let requiredCollateralizationRatio = effCollateralizationRatio.mul(TOTAL_SBPS).div(adjCollateralizationRatio);

    let totalSuppliedUSDValueString = getDecimalString(totalSuppliedUSDValue.toString(), 18, 2);
    let totalBorrowedUSDValueString = getDecimalString(totalBorrowedUSDValue.toString(), 18, 2);
    let totalAdjSuppliedUSDValueString = getDecimalString(totalAdjSuppliedUSDValue.toString(), 18, 2);
    let totalAdjBorrowedUSDValueString = getDecimalString(totalAdjBorrowedUSDValue.toString(), 18, 2);


    let effCollateralizationRatioString = effCollateralizationRatio.gte(INF) ? INF_CHAR : getDecimalString(effCollateralizationRatio.toString(), 16, 2);
    let requiredCollateralizationRatioString = getDecimalString(requiredCollateralizationRatio.toString(), 16, 2);

    vaultDetails = {
        totalSuppliedUSDValueString,
        totalBorrowedUSDValueString,
        totalAdjSuppliedUSDValueString,
        totalAdjBorrowedUSDValueString,
        effCollateralizationRatioString,
        requiredCollateralizationRatioString,
        ...vaultDetails
    };

    return vaultDetails;
}


//------------P-R-O-C-E-S-S---S-T-A-T-E---U-P-D-A-T-E-S----------------------
/* @PROCESS
 * These functions filter and batch calls to primary, secondary, etc ... state update functions
 *
 */

export function processPrimaryUpdates(forceUpdateObj, updateArr, provider, userAddress, globalInFlight, setGlobalInFlight, catchFunc) {
    if (provider !== null) {
        // InFlight + GlobalInFlight, system prevents excess remote resource calls
        setGlobalInFlight(true);
        let toCall = updateArr.filter(update => {
            // when !globalInFlight: forceUpdateObj[update.name] || (update.val === null) && !update.inFlight
            // when globalInFlight: forceUpdateObj[update.name] && !update.inFlight
            if ((forceUpdateObj[update.name] || (update.val === null && !globalInFlight)) && !update.inFlight) {
                update.setInFlight(true);
                return true;
            }
            return false;
        });
        setGlobalInFlight(false);

        return Promise.all(toCall.map(update => 
            update.updateFunction(provider, userAddress, update.setState)
                .catch(catchFunc)
                .then(ret => {update.setInFlight(false); update.ret = ret; return update})
        )).then(res => {
            let updateRecord = {};
            res.map(x => updateRecord[x.name] = x.ret);
            return updateRecord;
        });
    }
}

export function processSecondaryUpdates(primaryUpdates, updateArr, effectivePrimaryState) {
    if (primaryUpdates.length > 0) {
        let toCall = updateArr.filter(update => {
            for (let i = 0; i < update.deps.length; i++) {
                if (primaryUpdates.includes(update.deps[i])) {
                    return true;
                }
            }
            return false;
        });
        let retObj = {};
        toCall.map(update => {
            let newState = update.updateFunction(effectivePrimaryState);
            update.setState(newState);
            retObj[update.name] = newState;
        });
        return retObj;
    }
    else {
        return ({});
    }
}
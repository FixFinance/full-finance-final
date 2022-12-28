import { ethers, BigNumber as BN } from 'ethers';
import { ADDRESS0, TOTAL_SBPS, _0 } from '../../Utils/Consts.js';
import { getDecimalString } from '../../Utils/StringAlteration';

const IMetaMoneyMarketABI = require('../../abi/IMetaMoneyMarket.json');
const IFullLendTokenABI = require('../../abi/IFullLendToken.json');
const IERC20ABI = require('../../abi/IERC20.json');
const IChainlinkAggregatorABI = require('../../abi/IChainlinkAggregator.json');
const IInterestRateModelABI = require('../../abi/IInterestRateModel.json');

export function updateVault(provider, userAddress, setState) {
    const MMM = new ethers.Contract(process.env.REACT_APP_MMM_ADDRESS, IMetaMoneyMarketABI, provider);
    return MMM.getConnectedVault(userAddress).then(res => setState(res));
}

function getFLTbal(arr, index, flt, userAddress) {
    if (flt === null) return;
    return flt.balanceOf(userAddress).then(res => {
        arr[index] = res;
    }).catch(err => {
        console.error("ERROR WHILE UPDATING FLT BAL");
        console.error(err);
    });
}

export function updateFLTbals(provider, userAddress, setState) {
    let FLTs = JSON.parse(process.env.REACT_APP_FLTS)
        .map(x => new ethers.Contract(x, IFullLendTokenABI, provider));
    let ret = new Array(FLTs.length); ret.fill(_0);
    return Promise.all(FLTs.map((x, i) => getFLTbal(ret, i, x, userAddress))).then(() => setState(ret));
}

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
    return Promise.all(IRMs.map((x, i) => getIRMInfo(ret, i, x))).then(() => setState(ret));

}


export function updateAggInfo(provider, userAddress, setState) {
    let Aggs = JSON.parse(process.env.REACT_APP_AGGREGATORS)
        .map(x => new ethers.Contract(x, IChainlinkAggregatorABI, provider));
    let ret = new Array(Aggs.length); ret.fill(_0);
    return Promise.all(Aggs.map( (x, i) => x.latestAnswer().then(res => ret[i] = res) )).then(() => setState(ret));
}

export function updateAssetBals(provider, userAddress, setState) {
    let ASSETS = JSON.parse(process.env.REACT_APP_LISTED_ASSETS)
        .map(x => new ethers.Contract(x, IERC20ABI, provider));
    let ret = ASSETS.map(() => _0);
    return Promise.all(ASSETS.map( (x, i) => x.balanceOf(userAddress).then(res => ret[i] = res) )).then(() => setState(ret))
}

export function updateAssetAllowances(provider, userAddress, setState) {
    let ASSETS = JSON.parse(process.env.REACT_APP_LISTED_ASSETS)
        .map(x => new ethers.Contract(x, IERC20ABI, provider));
    let ESCROW_ADDRESSES = JSON.parse(process.env.REACT_APP_ESCROWS);
    let ret = ASSETS.map(() => _0);
    return Promise.all(ASSETS.map( (x, i) => x.allowance(userAddress, ESCROW_ADDRESSES[i]).then(res => ret[i] = res) )).then(() => setState(ret));
}


export function processUpdates(forceUpdateObj, updateArr, provider, userAddress, globalInFlight, setGlobalInFlight, catchFunc) {
    if (provider !== null) {
        // InFlight + GlobalInFlight, system prevents excess remote resource calls
        setGlobalInFlight(true);
        let updateRecord = {};
        let toCall = updateArr.filter(update => {
            // when !globalInFlight: forceUpdateObj[update.name] || (update.val === null) && !update.inFlight
            // when globalInFlight: forceUpdateObj[update.name] && !update.inFlight
            if ((forceUpdateObj[update.name] || (update.val === null && !globalInFlight)) && !update.inFlight) {
                updateRecord[update.name] = true;
                update.setInFlight(true);
                return true;
            }
            return false;
        });
        setGlobalInFlight(false);

        return Promise.all(toCall.map(update => 
            update.updateFunction(provider, userAddress, update.setState)
                .catch(catchFunc)
                .then(() => update.setInFlight(false))
        )).then(() => updateRecord);
    }
}
import { ethers, BigNumber as BN } from 'ethers';
import { ADDRESS0, TOTAL_SBPS, _0 } from '../../Utils/Consts.js';
import { getDecimalString } from '../../Utils/StringAlteration';

const IMetaMoneyMarketABI = require('../../abi/IMetaMoneyMarket.json');
const IFullLendTokenABI = require('../../abi/IFullLendToken.json');
const IERC20ABI = require('../../abi/IERC20.json');
const IChainlinkAggregatorABI = require('../../abi/IChainlinkAggregator.json');
const IInterestRateModelABI = require('../../abi/IInterestRateModel.json');

export function updateVault(provider, userAddress, setState, setInFlight) {
    if (provider === null) return;
    setInFlight(true);
    const MMM = new ethers.Contract(process.env.REACT_APP_MMM_ADDRESS, IMetaMoneyMarketABI, provider);
    MMM.getConnectedVault(userAddress).then(res => {
        setState(res);
        setInFlight(false);
    });
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

export function updateFLTbals(provider, userAddress, setState, setInFlight) {
    if (provider === null) return;
    setInFlight(true);
    let FLTs = JSON.parse(process.env.REACT_APP_FLTS)
        .map(x => new ethers.Contract(x, IFullLendTokenABI, provider));
    let ret = new Array(FLTs.length); ret.fill(_0);
    Promise.all(FLTs.map((x, i) => getFLTbal(ret, i, x, userAddress))).then(() => {
        setState(ret)
        setInFlight(false);
    });
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

export function updateIRMInfo(provider, userAddress, setState, setInFlight) {
    if (provider === null) return;
    setInFlight(true);
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
    Promise.all(IRMs.map((x, i) => getIRMInfo(ret, i, x))).then(() => {
        setState(ret);
        setInFlight(false);
    });

}


export function updateAggInfo(provider, userAddress, setState, setInFlight) {
    if (provider === null) return;
    setInFlight(true);
    let Aggs = JSON.parse(process.env.REACT_APP_AGGREGATORS)
        .map(x => new ethers.Contract(x, IChainlinkAggregatorABI, provider));
    let ret = new Array(Aggs.length); ret.fill(_0);
    Promise.all(Aggs.map( (x, i) => x.latestAnswer().then(res => ret[i] = res) )).then(() => {
        setState(ret);
        setInFlight(false);
    });
}

export function updateAssetBals(provider, userAddress, setState, setInFlight) {
    if (provider === null) return;
    setInFlight(true);
    let ASSETS = JSON.parse(process.env.REACT_APP_LISTED_ASSETS)
        .map(x => new ethers.Contract(x, IERC20ABI, provider));
    let ret = ASSETS.map(() => _0);
    Promise.all(ASSETS.map( (x, i) => x.balanceOf(userAddress).then(res => ret[i] = res) )).then(() => {
        setState(ret);
        setInFlight(false);
    })
}

export function updateAssetAllowances(provider, userAddress, setState, setInFlight) {
    if (provider === null) return;
    setInFlight(true);
    let ASSETS = JSON.parse(process.env.REACT_APP_LISTED_ASSETS)
        .map(x => new ethers.Contract(x, IERC20ABI, provider));
    let ESCROW_ADDRESSES = JSON.parse(process.env.REACT_APP_ESCROWS);
    let ret = ASSETS.map(() => _0);
    Promise.all(ASSETS.map( (x, i) => x.allowance(userAddress, ESCROW_ADDRESSES[i]).then(res => ret[i] = res) )).then(() => {
        setState(ret);
        setInFlight(false);
    })
}


export function processUpdates(forceUpdateObj, updateArr, provider, userAddress) {
    for (let i = 0; i < updateArr.length; i++) {
        let update = updateArr[i];
        if ((forceUpdateObj[update.name] || update.val === null) && !update.inFlight) {
            console.log("UPDATING", update.name);
            update.updateFunction(provider, userAddress, update.setState, update.setInFlight);
        }
    }
}
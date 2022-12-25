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
    console.log("GETTING BALANCE", flt.address);
    return flt.balanceOf(userAddress).then(res => {
        console.log("GOT BALANCE", flt.address);
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

function getAggInfo(arr, index, agg) {
    return agg.latestAnswer().then(res => arr[index] = res)
}

export function updateAggInfo(provider, userAddress, setState, setInFlight) {
    if (provider === null) return;
    setInFlight(true);
    let Aggs = JSON.parse(process.env.REACT_APP_AGGREGATORS)
        .map(x => new ethers.Contract(x, IChainlinkAggregatorABI, provider));
    let ret = new Array(Aggs.length); ret.fill(_0);
    Promise.all(Aggs.map((x, i) => getAggInfo(ret, i, x))).then(() => {
        setState(ret);
        setInFlight(false);
    });
}

export function processUpdates(updateArr, provider, userAddress) {
    for (let i = 0; i < updateArr.length; i++) {
        if (updateArr[i].val === null && !updateArr[i].inFlight) {
            updateArr[i].updateFunction(provider, userAddress, updateArr[i].setState, updateArr[i].setInFlight);
        }
    }
}
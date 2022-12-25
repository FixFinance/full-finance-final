import React, {createContext, useState} from 'react'
import { ethers, BigNumber as BN } from 'ethers';
import { ADDRESS0, TOTAL_SBPS, _0 } from '../../Utils/Consts.js';
import { TargetChains, LocalhostChain } from '../../Utils/TargetChains';
import { getDecimalString } from '../../Utils/StringAlteration';
import { getAnnualizedRate } from '../../Utils/RateMath';
import Moralis from "moralis";

const IMetaMoneyMarketABI = require('../../abi/IMetaMoneyMarket.json');
const IFullLendTokenABI = require('../../abi/IFullLendToken.json');
const IERC20ABI = require('../../abi/IERC20.json');
const IChainlinkAggregatorABI = require('../../abi/IChainlinkAggregator.json');
const IInterestRateModelABI = require('../../abi/IInterestRateModel.json');

async function getProvider(walletType)  {
    if (walletType === 'metamask') {
        if (typeof(window.ethereum) !== 'undefined') {
            const provider = await Moralis.enableWeb3({provider: 'metamask'});
            return provider;
        }
        return null;
    }
    return null;
}

export const EthersContext = createContext();

export default function EthersProvider({children}) {

    const [walletType, setWalletType] = useState('basic');
    const [ethersProvider, setEthersProvider] = useState(null);
    const [userAddress, setUserAddress] = useState(ADDRESS0);
    const [userETH, setUserETH] = useState('0');
    const [userENS, setUserENS] = useState(null);
    const [userAvatar, setUserAvatar] = useState(null);
    const [chainId, setChainId] = useState(-1);

    const [vault, setVault] = useState(null);
    const [vaultInFlight, setVaultInFlight] = useState(false);
    const [fltBals, setFLTBals] = useState(null);
    const [fltBalsInFlight, setFLTBalsInFlight] = useState(false);
    const [irmInfo, setIRMInfo] = useState(null);
    const [irmInfoInFlight, setIRMInfoInFlight] = useState(false);
    const [aggInfo, setAggInfo] = useState(null);
    const [aggInfoInFlight, setAggInfoInFlight] = useState(false);

    const [supplyLentBN, setSupplyLentBN] = useState(null);
    const [supplyBorrowedBN, setSupplyBorrowedBN] = useState(null);
    const [annualLendRateString, setAnnualLendRateString] = useState('0');
    const [annualBorrowRateString, setAnnualBorrowRateString] = useState('0');
    const [valueLentString, setValueLentString] = useState('0');
    const [valueBorrowedString, setValueBorrowedString] = useState('0');
    const [infuraUp, setInfuraUp] = useState(true);

    function setWrongChainState() {
        console.log(`Logging out`);
        setWalletType('basic');
        setEthersProvider(null);
        setUserAddress(ADDRESS0);
        setUserETH('0');
        setUserENS(null);
        setUserAvatar(null);
        setChainId(-1);
    }

    function provider_disconnect() {
        setWalletType('basic');
        setEthersProvider(null);
        setUserAddress(ADDRESS0);
        setUserETH('0');
        setUserENS(null);
        setUserAvatar(null);
        setChainId(-1);
    }

    function updateWalletInfo(providerSet, selectedWalletType, setWrongChainCallback) {
        let _userAddress = ADDRESS0;
        let _userETH = '0';
        let _userENS = null;
        let _userAvatar = null;
        let promiseArray = [
            providerSet.send("eth_requestAccounts", []).then(accounts => {
                if (accounts.length > 0) {
                    _userAddress = accounts[0];
                    let getETHpromise = providerSet.getBalance(accounts[0]);
                    let ensPromise = providerSet.lookupAddress(accounts[0]).catch(err => null);
                    let avatarPromise = providerSet.getAvatar(accounts[0]).catch(err => null);
                    return Promise.all([getETHpromise, ensPromise, avatarPromise]).then(resArr => {
                        _userETH = getDecimalString(resArr[0].toString(), 18, 4);
                        _userENS = resArr[1];
                        _userAvatar = resArr[2];
                    });
                }
            }),
            providerSet.getNetwork()
        ];
        Promise.all(promiseArray).then(res => {
            let network = res[1];
            if (typeof(network) !== 'undefined' && TargetChains.includes(network.chainId)) {
                setEthersProvider(providerSet);
                setWalletType(selectedWalletType);
                setUserAddress(_userAddress);
                setUserETH(_userETH);
                setUserENS(_userENS);
                setUserAvatar(_userAvatar);
                setChainId(network.chainId);
            }
            else {
                setWrongChainState();
                setWrongChainCallback();
            }
        });

    }

    function getWalletInfo(selectedWalletType='basic', setWrongChainCallback=(() => {})) {
        if (selectedWalletType === 'basic' && walletType !== 'basic') {
            selectedWalletType = walletType;
        }
        console.log("selectedWalletType:walletType", selectedWalletType, walletType);
        if (selectedWalletType !== walletType) {
            getProvider(selectedWalletType).then(async (provider) => {
                if (provider !== null) {
                    updateWalletInfo(provider, selectedWalletType, setWrongChainCallback);
                }
            });
        }
        return [ethersProvider, userAddress, userETH, userENS, userAvatar, chainId, walletType];
    }

    function getBasicInfo() {
        return {
            vault,
            fltBals,
            irmInfo,
            aggInfo
        };
    }

    function updateVault(MMM) {
        if (MMM !== null) {
            setVaultInFlight(true);
            MMM.getConnectedVault(userAddress).then(res => {
                setVault(res);
                setVaultInFlight(false);
            });
        }
    }

    function getFLTbal(arr, index, flt) {
        if (flt === null) return;
        return flt.balanceOf(userAddress).then(res => {
            arr[index] = res;
        }).catch(err => {
            console.error("ERROR WHILE UPDATING FLT BAL");
            console.error(err);
        });
    }

    function updateFLTbals(provider) {
        if (provider === null) return;
        setFLTBalsInFlight(true);
        let FLTs = JSON.parse(process.env.REACT_APP_FLTS)
            .map(x => new ethers.Contract(x, IFullLendTokenABI, provider));
        let ret = new Array(FLTs.length);
        ret.fill(_0);
        Promise.all(FLTs.map((x, i) => getFLTbal(ret, i, x))).then(() => {
            setFLTBals(ret)
            setFLTBalsInFlight(false);
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

    function updateIrmInfo(provider) {
        if (provider === null) return;
        setIRMInfoInFlight(true);
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
            setIRMInfo(ret);
            setIRMInfoInFlight(false);
        });

    }

    function updateBasicInfo() {
        const DEFAULT_VIEW_CHAIN = 'kovan';
        const provider = ethersProvider == null && infuraUp ? new ethers.providers.InfuraProvider(DEFAULT_VIEW_CHAIN, process.env.REACT_APP_INFURA_API_KEY) : ethersProvider;

        let MMM = provider == null ? null : new ethers.Contract(process.env.REACT_APP_MMM_ADDRESS, IMetaMoneyMarketABI, provider);

        if (chainId === LocalhostChain) {
            if (vault === null && !vaultInFlight) {
                updateVault(MMM);
            }

            if (fltBals === null && !fltBalsInFlight) {
                updateFLTbals(provider);
            }

            if (irmInfo === null && !irmInfoInFlight) {
                updateIrmInfo(provider);
            }
        }
    }

    return (
        <EthersContext.Provider value={[getWalletInfo, getBasicInfo, updateBasicInfo, provider_disconnect]}>
            {children}
        </EthersContext.Provider>
    )
}
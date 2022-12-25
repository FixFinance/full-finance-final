import React, {createContext, useState} from 'react'
import { ethers, BigNumber as BN } from 'ethers';
import { ADDRESS0, TOTAL_SBPS, _0 } from '../../Utils/Consts.js';
import { TargetChains, LocalhostChain } from '../../Utils/TargetChains';
import { getDecimalString } from '../../Utils/StringAlteration';
import { getAnnualizedRate } from '../../Utils/RateMath';
import {
    updateVault,
    updateFLTbals,
    updateIRMInfo,
    updateAggInfo,
    processUpdates
} from './StateUpdates';
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

    function updateBasicInfo() {
        const DEFAULT_VIEW_CHAIN = 'kovan';
        const provider = ethersProvider == null && infuraUp ? new ethers.providers.InfuraProvider(DEFAULT_VIEW_CHAIN, process.env.REACT_APP_INFURA_API_KEY) : ethersProvider;

        if (chainId === LocalhostChain) {
            const MakeUpdateObj = (val, inFlight, updateFunction, setState, setInFlight) => ({val, inFlight, updateFunction, setState, setInFlight});
            const UpdateArr = [
                MakeUpdateObj(vault, vaultInFlight, updateVault, setVault, setVaultInFlight),
                MakeUpdateObj(fltBals, fltBalsInFlight, updateFLTbals, setFLTBals, setFLTBalsInFlight),
                MakeUpdateObj(irmInfo, irmInfoInFlight, updateIRMInfo, setIRMInfo, setIRMInfoInFlight),
                MakeUpdateObj(aggInfo, aggInfoInFlight, updateAggInfo, setAggInfo, setAggInfoInFlight)
            ];
            processUpdates(UpdateArr, provider, userAddress);
        }
    }

    return (
        <EthersContext.Provider value={[getWalletInfo, getBasicInfo, updateBasicInfo, provider_disconnect]}>
            {children}
        </EthersContext.Provider>
    )
}
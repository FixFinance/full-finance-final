import React, {createContext, useState} from 'react'
import { ethers, BigNumber as BN } from 'ethers';
import { ADDRESS0, TOTAL_SBPS, _0 } from '../../Utils/Consts.js';
import { TargetChains, LocalhostChain } from '../../Utils/TargetChains';
import { getDecimalString } from '../../Utils/StringAlteration';
import {
    updateVault,
    updateFLTbals,
    updateIRMInfo,
    updateAggInfo,
    updateAssetBals,
    updateAssetAllowances,
    processPrimaryUpdates,
    updateVaultDetails,
    processSecondaryUpdates
} from './StateUpdates';

const IMetaMoneyMarketABI = require('../../abi/IMetaMoneyMarket.json');
const IFullLendTokenABI = require('../../abi/IFullLendToken.json');
const IERC20ABI = require('../../abi/IERC20.json');
const IChainlinkAggregatorABI = require('../../abi/IChainlinkAggregator.json');
const IInterestRateModelABI = require('../../abi/IInterestRateModel.json');

async function getProvider(walletType)  {
    if (walletType === 'metamask') {
        if (typeof(window.ethereum) !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            return provider;
        }
        return null;
    }
    return null;
}

export const EthersContext = createContext();

let CALL = 0;

export default function EthersProvider({children}) {

    const [walletType, setWalletType] = useState('basic');
    const [ethersProvider, setEthersProvider] = useState(null);
    const [userAddress, setUserAddress] = useState(ADDRESS0);
    const [userETH, setUserETH] = useState('0');
    const [userENS, setUserENS] = useState(null);
    const [userAvatar, setUserAvatar] = useState(null);
    const [chainId, setChainId] = useState(-1);
    const [infuraUp, setInfuraUp] = useState(true);

    // InFlight + GlobalInFlight, system prevents excess remote resource calls
    const [globalInFlight, setGlobalInFlight] = useState(false);

    // primary state, request intensive to find
    const [vault, setVault] = useState(null);
    const [fltBals, setFLTBals] = useState(null);
    const [irmInfo, setIRMInfo] = useState(null);
    const [aggInfo, setAggInfo] = useState(null);
    const [assetBals, setAssetBals] = useState(null);
    const [assetAllowances, setAssetAllowances] = useState(null);

    // in flight status for primary state
    const [vaultInFlight, setVaultInFlight] = useState(false);
    const [fltBalsInFlight, setFLTBalsInFlight] = useState(false);
    const [irmInfoInFlight, setIRMInfoInFlight] = useState(false);
    const [aggInfoInFlight, setAggInfoInFlight] = useState(false);
    const [assetBalsInFlight, setAssetBalsInFlight] = useState(false);
    const [assetAllowancesInFlight, setAssetAllowancesInFlight] = useState(false);

    // seconday state, compute intensivve *these do not have in flight status*
    const [vaultDetails, setVaultDetails] = useState(null);


    function resetEthersState() {
        setVault(null); setVaultInFlight(false);
        setFLTBals(null); setFLTBalsInFlight(false);
        setIRMInfo(null); setIRMInfoInFlight(false);
        setAggInfo(null); setAggInfoInFlight(false);
    }

    function setWrongChainState() {
        console.log(`Logging out`);
        setWalletType('basic');
        setEthersProvider(null);
        setUserAddress(ADDRESS0);
        setUserETH('0');
        setUserENS(null);
        setUserAvatar(null);
        setChainId(-1);
        setVault(null);
        resetEthersState();
    }

    function provider_disconnect() {
        setWalletType('basic');
        setEthersProvider(null);
        setUserAddress(ADDRESS0);
        setUserETH('0');
        setUserENS(null);
        setUserAvatar(null);
        setChainId(-1);
        resetEthersState();
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
                console.log("Calling from updateWalletInfo");
                updateBasicInfo({}, providerSet, network.chainId, _userAddress);
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
            aggInfo,
            assetBals,
            assetAllowances,
            vaultDetails
        };
    }

    async function updateBasicInfo(forceUpdateObj={}, inputProvider=ethersProvider, chid=chainId, userAddr=userAddress) {
        const DEFAULT_VIEW_CHAIN = 'kovan';
        const USE_INFURA = inputProvider === null && infuraUp;
        const provider = USE_INFURA ? new ethers.providers.InfuraProvider(DEFAULT_VIEW_CHAIN, process.env.REACT_APP_INFURA_API_KEY) : inputProvider;

        let callNum = ++CALL;
        console.log("USE BASIC INFO CALL#", callNum);

        if (TargetChains.includes(chid)) {
            const PrimaryUpdateObj = (name, val, inFlight, updateFunction, setState, setInFlight) => ({name, val, inFlight, updateFunction, setState, setInFlight});
            const PrimaryUpdateArr = [
                PrimaryUpdateObj('vault', vault, vaultInFlight, updateVault, setVault, setVaultInFlight),
                PrimaryUpdateObj('fltBals', fltBals, fltBalsInFlight, updateFLTbals, setFLTBals, setFLTBalsInFlight),
                PrimaryUpdateObj('irmInfo', irmInfo, irmInfoInFlight, updateIRMInfo, setIRMInfo, setIRMInfoInFlight),
                PrimaryUpdateObj('aggInfo', aggInfo, aggInfoInFlight, updateAggInfo, setAggInfo, setAggInfoInFlight),
                PrimaryUpdateObj('assetBals', assetBals, assetBalsInFlight, updateAssetBals, setAssetBals, setAssetBalsInFlight),
                PrimaryUpdateObj('assetAllowances', assetAllowances, assetAllowancesInFlight, updateAssetAllowances, setAssetAllowances, setAssetAllowancesInFlight)
            ];
            const catchFunc = err => {console.error(err); if (USE_INFURA) setInfuraUp(false);};
            let primaryUpdateMap = await processPrimaryUpdates(forceUpdateObj, PrimaryUpdateArr, provider, userAddr, globalInFlight, setGlobalInFlight, catchFunc);

            console.log("PROCESSED UPDATES", callNum, Object.keys(primaryUpdateMap), Object.keys(forceUpdateObj));
            let effectivePrimaryState = { vault, fltBals, irmInfo, aggInfo, assetBals, assetAllowances, ...primaryUpdateMap };

            const SecondaryUpdateObj = (name, updateFunction, setState, deps) => ({name, updateFunction, setState, deps});
            const SecondaryUpdateArr = [
                SecondaryUpdateObj('vaultDetails', updateVaultDetails, setVaultDetails, ['vault', 'aggInfo', 'irmInfo']),
            ]
            let secondaryUpdateMap = processSecondaryUpdates(Object.keys(primaryUpdateMap), SecondaryUpdateArr, effectivePrimaryState);
            console.log("SECONDARY UPDATES", callNum, Object.keys(secondaryUpdateMap), Object.keys(primaryUpdateMap));
        }
    }

    return (
        <EthersContext.Provider value={[getWalletInfo, getBasicInfo, updateBasicInfo, provider_disconnect]}>
            {children}
        </EthersContext.Provider>
    )
}
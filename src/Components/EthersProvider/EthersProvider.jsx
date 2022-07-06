import React, {createContext, useState} from 'react'
import { useMoralis } from "react-moralis";
import { ethers, BigNumber as BN } from 'ethers';
import { ADDRESS0, TOTAL_SBPS, _0 } from '../../Utils/Consts.js';
import { TargetChains } from '../../Utils/TargetChains';
import { getDecimalString } from '../../Utils/StringAlteration';
import { getAnnualizedRate } from '../../Utils/RateMath';
import Moralis from "moralis";

const ICoreMoneyMarketABI = require('../../abi/ICoreMoneyMarket.json');
const IERC20ABI = require('../../abi/IERC20.json');
const IChainlinkAggregatorABI = require('../../abi/IChainlinkAggregator.json');

function getProvider(walletType)  {
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

export default function EthersProvider({children}) {

    const [walletType, setWalletType] = useState('basic');
    const [ethersProvider, setEthersProvider] = useState(null);
    const [user, setUser] = useState(null);
    const [userAddress, setUserAddress] = useState(ADDRESS0);
    const [userETH, setUserETH] = useState('0');
    const [userENS, setUserENS] = useState(null);
    const [userAvatar, setUserAvatar] = useState(null);
    const [chainId, setChainId] = useState(-1);

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

    async function login () {
        try {
            const provider = await Moralis.enableWeb3();
            await Moralis.authenticate();
            setUser(true);
            const currentUser = Moralis.User.current();
            const ethAddress = currentUser.get("ethAddress");
            setUserAddress(ethAddress);
            const getAvatar = await provider.getAvatar(ethAddress);
            setUserAvatar(getAvatar);
            const signer = provider.getSigner(ethAddress);
            const networkInfo = await provider.getNetwork();
            const chainId = networkInfo.chainId.toString();
            setChainId(chainId);
        } catch (error) {
            console.log(error);
        }
    }

    async function logout () {
        try {
            await Moralis.User.logOut();
            setUser(null);
        } catch (err) {
            console.log(err)
        }
    }


    function getWalletInfo(selectedWalletType='basic', setWrongChainCallback=(() => {})) {

        if (selectedWalletType === 'basic' && walletType !== 'basic') {
            selectedWalletType = walletType;
        }
        let providerSet;
        if (selectedWalletType !== walletType) {
            providerSet = getProvider(selectedWalletType);
            if (providerSet !== null) {
                let _userAddress = ADDRESS0;
                let _userETH = '0';
                let _userENS = null;
                let _userAvatar = null;
                let _chainId = -1;
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
        }
        let providerToReturn = walletType === selectedWalletType ? ethersProvider : providerSet;
        return [providerToReturn, userAddress, userETH, userENS, userAvatar, chainId, walletType, user];
    }

    function getBasicInfo() {
        return {
            annualLendRateString,
            annualBorrowRateString,
            valueLentString,
            valueBorrowedString,
            supplyLentBN,
            supplyBorrowedBN
        };
    }

    function updateBasicInfo() {
        const provider = infuraUp ? new ethers.providers.InfuraProvider('kovan', process.env.REACT_APP_INFURA_API_KEY) : ethersProvider;
        let CMM = provider == null ? null : new ethers.Contract(process.env.REACT_APP_CMM_ADDRESS, ICoreMoneyMarketABI, provider);
        let BaseAgg = provider == null ? null : new ethers.Contract(process.env.REACT_APP_BASE_ASSET_AGGREGATOR_ADDRESS, IChainlinkAggregatorABI, provider);

        let catchFunc = () => setInfuraUp(false);

        if (BaseAgg != null && CMM != null) {
            BaseAgg.latestAnswer().then(answer => {
                CMM.getSupplyLent().then(supplyLent => {
                    setSupplyLentBN(supplyLent);
                    let valueBN = answer.mul(supplyLent).div(TOTAL_SBPS);
                    setValueLentString(getDecimalString(valueBN.toString(), 18, 0));
                });
                CMM.getSupplyBorrowed().then(supplyBorrowed => {
                    setSupplyBorrowedBN(supplyBorrowed);
                    let valueBN = answer.mul(supplyBorrowed).div(TOTAL_SBPS);
                    setValueBorrowedString(getDecimalString(valueBN.toString(), 18, 0));
                });
            }).catch(catchFunc);

            CMM.getPrevSILOR().then(silor => {
                let annualized = getAnnualizedRate(silor);
                let pct = annualized.sub(TOTAL_SBPS);
                let rateString = getDecimalString(pct.toString(), 16, 3);
                setAnnualLendRateString(rateString);
            }).catch(catchFunc);

            CMM.getPrevSIBOR().then(sibor => {
                let annualized = getAnnualizedRate(sibor);
                let pct = annualized.sub(TOTAL_SBPS);
                let rateString = getDecimalString(pct.toString(), 16, 3);
                setAnnualBorrowRateString(rateString);
            }).catch(catchFunc);
        }
    }

    return (
        <EthersContext.Provider value={[getWalletInfo, getBasicInfo, updateBasicInfo, login, logout]}>
            {children}
        </EthersContext.Provider>
    )
}
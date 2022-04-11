import React, {createContext, useState} from 'react'
import { ethers, BigNumber as BN } from 'ethers';
import { ADDRESS0 } from '../../Utils/Consts';
import { TargetChains } from '../../Utils/TargetChains';
import { getDecimalString } from '../../Utils/StringAlteration';

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
    const [userAddress, setUserAddress] = useState(ADDRESS0);
    const [userETH, setUserETH] = useState('0');
    const [userENS, setUserENS] = useState(null);
    const [chainId, setChainId] = useState(-1);
    
    function setWrongChainState() {
        setWalletType('basic');
        setEthersProvider(null);
        setUserAddress(ADDRESS0);
        setUserETH('0');
        setUserENS(null);
        setChainId(-1);
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
                let _chainId = -1;
                let promiseArray = [
                    providerSet.send("eth_requestAccounts", []).then(accounts => {
                        if (accounts.length > 0) {
                            _userAddress = accounts[0];
                            let getETHpromise = providerSet.getBalance(accounts[0]);
                            let ensPromise = providerSet.lookupAddress(accounts[0]).catch(err => null);
                            return Promise.all([getETHpromise, ensPromise]).then(resArr => {
                                _userETH = getDecimalString(resArr[0].toString(), 18, 4);
                                _userENS = resArr[1]
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
        return [providerToReturn, userAddress, userETH, userENS, chainId, walletType];
    }

    return (
        <EthersContext.Provider value={[getWalletInfo]}>
            {children}
        </EthersContext.Provider>
    )
}
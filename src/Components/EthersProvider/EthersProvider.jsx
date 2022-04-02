import React, {createContext, useState} from 'react'
import { ethers } from 'ethers';
import { Constants } from '../../Utils/Consts.js';
const { ADDRESS0 } = Constants;

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

export const EthersContext = React.createContext();

export default function EthersProvider({children}) {

    const [counter, setCounter] = useState(0);
    const [walletType, setWalletType] = useState('basic');
    const [ethersProvider, setEthersProvider] = useState(null);
    const [userAddress, setUserAddress] = useState(ADDRESS0);
    const [userENS, setUserENS] = useState(null);
    const [chainId, setChainId] = useState(-1);
    
    function getWalletInfo(selectedWalletType='basic') {
        if (selectedWalletType === 'basic' && walletType !== 'basic') {
            selectedWalletType = walletType;
        }
        let providerSet;
        if (selectedWalletType !== walletType) {
            setCounter(counter+1);
            providerSet = getProvider(selectedWalletType);
            if (providerSet !== null) {
                setEthersProvider(providerSet);
                setWalletType(selectedWalletType);
                let promiseArray = [
                    providerSet.send("eth_requestAccounts", []).then(accounts => {
                        if (accounts.length > 0) {
                            setUserAddress(accounts[0]);
                            return providerSet.lookupAddress(accounts[0]);
                        }
                        else {
                            setUserAddress(ADDRESS0);
                            return null;
                        }
                    }).then(res => setUserENS(res)),
                    providerSet.getNetwork().then(res => setChainId(res.chainId))
                ];
            }
        }
        let providerToReturn = walletType === selectedWalletType ? ethersProvider : providerSet;
        return [providerToReturn, userAddress, userENS, chainId, walletType];
    }

    return (
        <EthersContext.Provider value={getWalletInfo}>
            {children}
        </EthersContext.Provider>
    )
}
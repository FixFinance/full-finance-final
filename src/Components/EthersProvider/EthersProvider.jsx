import React, {createContext, useState} from 'react'
import { ethers, BigNumber as BN } from 'ethers';
import { ADDRESS0 } from '../../Utils/Consts.js';

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
    
    function getWalletInfo(selectedWalletType='basic') {
        if (selectedWalletType === 'basic' && walletType !== 'basic') {
            selectedWalletType = walletType;
        }
        let providerSet;
        if (selectedWalletType !== walletType) {
            providerSet = getProvider(selectedWalletType);
            if (providerSet !== null) {
                setEthersProvider(providerSet);
                setWalletType(selectedWalletType);
                let promiseArray = [
                    providerSet.send("eth_requestAccounts", []).then(accounts => {
                        if (accounts.length > 0) {
                            setUserAddress(accounts[0]);
                            let getETHpromise = providerSet.getBalance(accounts[0]);
                            let ensPromise = providerSet.lookupAddress(accounts[0]).catch(err => null);
                            return Promise.all([getETHpromise, ensPromise]).then(resArr => {
                                let divisor = BN.from(10).pow(BN.from(14));
                                let str = resArr[0].div(divisor).toString();
                                if (str.length <= 4) {
                                    str = '0.'+'0'.repeat(4-str.length)+str;
                                }
                                else {
                                    str = str.substring(0, str.length-4)+'.'+str.substring(str.length-4);
                                }
                                setUserETH(str);
                                setUserENS(resArr[1]);
                            });
                        }
                        else {
                            setUserAddress(ADDRESS0);
                            return null;
                        }
                    }),
                    providerSet.getNetwork().then(res => setChainId(res.chainId))
                ];
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
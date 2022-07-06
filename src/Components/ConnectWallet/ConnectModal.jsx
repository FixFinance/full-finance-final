import React, { useState, useContext, useRef } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "./connectmodal.scss";
import icon1 from "../../assets/image/icon1.svg";
import icon2 from "../../assets/image/icon2.svg";
import icon3 from "../../assets/image/icon3.svg";
import icon4 from "../../assets/image/icon4.svg";
import { Link } from "react-router-dom";
import DepositPopup from "../Deposit & Withdraw Modals/DepositPopup";
import WrongNetworkModal from "./WrongNetworkModal";
import AccountModal2 from "../AccountModals/AccountModal2";
import { EthersContext } from "../EthersProvider/EthersProvider";
import { LoginContext } from "../../helper/userContext";
import Moralis from "moralis";
import { useMoralis, useMoralisWeb3Api } from "react-moralis";

import { TargetChains } from '../../Utils/TargetChains.js';

const ConnectModal = ({ handleClose }) => {
  const [selectedModal, setSelectedModal] = useState("basic");
  const [showWrongNetwork, setShowWrongNetwork] = useState(false);
  const [error, setError] = useState(false);

  const handleSetWrongNetwork = () => setShowWrongNetwork(true);

  const Web3Api = useMoralisWeb3Api();

  const {loggedIn, setLoggedIn, userAddress, setUserAddress, userETH, setUserETH, userENS, setUserENS, userAvatar, setUserAvatar} = useContext(LoginContext);

  const [getWalletInfo] = useContext(EthersContext);
  const [chainId, walletType] = getWalletInfo(selectedModal, handleSetWrongNetwork);

  let connectedToWallet = selectedModal !== 'basic' && selectedModal !== 'error';
  let onWrongChain = connectedToWallet && chainId !== -1 && !TargetChains.includes(chainId);

  async function login () {
    try {
        const provider = await Moralis.enableWeb3();
        await Moralis.authenticate();
        setLoggedIn(true);
        const currentUser = Moralis.User.current();
        const balance = await Web3Api.account.getNativeBalance();
        let rawBalance = (balance.balance / 10e17).toFixed(4);
        setUserETH(rawBalance);
        const ethAddress =await currentUser.get("ethAddress");
        setUserAddress(ethAddress);
        console.log(ethAddress)
        const getEns = provider.lookupAddress(ethAddress);
        setUserENS(getEns);
        const getAvatar = await provider.getAvatar(ethAddress);
        setUserAvatar(getAvatar);
        const signer = provider.getSigner(ethAddress);
        const networkInfo = await provider.getNetwork();
        const chainId = networkInfo.chainId.toString();
        console.log(currentUser)
        console.log(networkInfo)
        handleClose();
    } catch (error) {
        console.log(error);
    }
  }

  return (
    <div className="connect-modal">
      {selectedModal === "basic" && (
        <Modal.Header closeButton>
          <h5>Connect Wallet</h5>
        </Modal.Header>
      )}

      <Modal.Body>
        {showWrongNetwork && (
          <>
            <WrongNetworkModal handleClose={handleClose}/>
          </>
        )}

        {selectedModal === "basic" && (
          <>
            {error === true &&
            <p className="modal-error">Something went wrong with your wallet connection. Try again</p>
            }
            <div className="form-group">
              <div
                  className="d-flex form-field justify-content-between"
                  onClick={() => {
                    login();
                  }}
              >
                <div className="field-text align-self-center">
                  Metamask
                </div>
                <div className="icon_container">
                  <img src={icon1} alt="img" className="icon_img" />
                </div>
              </div>
            </div>
            <div className="form-group">
              <div
                onClick={() => setSelectedModal("walletConnect")}
                className="d-flex form-field justify-content-between"
              >
                <div className="field-text align-self-center">
                  WalletConnect
                </div>
                <div className="icon_container">
                  <img src={icon2} alt="img" className="icon_img" />
                </div>
              </div>
            </div>
            <div className="form-group">
              <div className="d-flex form-field justify-content-between">
                <div className="field-text align-self-center">
                  Coinbase Wallet
                </div>
                <div className="icon_container">
                  <img src={icon3} alt="img" className="icon_img" />
                </div>
              </div>
            </div>
            <div className="form-group">
              <div className="d-flex form-field justify-content-between">
                <div className="field-text align-self-center">Portis</div>
                <div className="icon_container">
                  <img src={icon4} alt="img" className="icon_img" />
                </div>
              </div>
            </div>
            <div className="">
              <Link to="/.." onClick={() => setSelectedModal("error")}>
                <p>What are these?</p>
              </Link>
            </div>
          </>
        )}

        {selectedModal !== "error" && selectedModal !== "basic" && !showWrongNetwork &&
          <AccountModal2 address={userAddress} ens={userENS} avatar={userAvatar}/>
        }
      </Modal.Body>
    </div>
  );
};

export default ConnectModal;

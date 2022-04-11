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

import { TargetChains } from '../../Utils/TargetChains.js';

const ConnectModal = ({ handleClose }) => {
  const [selectedModal, setSelectedModal] = useState("basic");
  const [showWrongNetwork, setShowWrongNetwork] = useState(false);

  const handleSetWrongNetwork = () => setShowWrongNetwork(true);

  const [getWalletInfo] = useContext(EthersContext);
  const [provider, userAddress, userETH, userENS, chainId, walletType] = getWalletInfo(selectedModal, handleSetWrongNetwork);

  let connectedToWallet = selectedModal !== 'basic' && selectedModal !== 'error';
  let onWrongChain = connectedToWallet && chainId !== -1 && !TargetChains.includes(chainId);

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
            <div className="form-group">
              <div
                  className="d-flex form-field justify-content-between"
                  onClick={() => {
                    setSelectedModal("metamask");
                  }}
              >
                <div className="field-text align-self-center">
                  Metamask
                </div>
                <img src={icon1} alt="img" className="icon_img" />
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
                <img src={icon2} alt="img" className="icon_img" />
              </div>
            </div>
            <div className="form-group">
              <div className="d-flex form-field justify-content-between">
                <div className="field-text align-self-center">
                  Coinbase Wallet
                </div>
                <img src={icon3} alt="img" className="icon_img" />
              </div>
            </div>
            <div className="form-group">
              <div className="d-flex form-field justify-content-between">
                <div className="field-text align-self-center">Portis</div>
                <img src={icon4} alt="img" className="icon_img" />
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
          <AccountModal2 walletType={selectedModal} address={userAddress} ens={userENS}/>
        }
      </Modal.Body>
    </div>
  );
};

export default ConnectModal;

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

import { TargetChains } from '../../Utils/TargetChains.js';

const ConnectModal = ({ handleClose }) => {
  const [selectedModal, setSelectedModal] = useState("basic");
  const [show, setShow] = useState(true);
  const [showWrongNetwork, setShowWrongNetwork] = useState(false);
  const [error, setError] = useState(false);

  const handleSetWrongNetwork = () => setShowWrongNetwork(true);

  const handleClose2 = () => {
    setShowWrongNetwork(false);
  }

  const [getWalletInfo, , , provider_disconnect] = useContext(EthersContext);
  const [, userAddress, userETH, userENS, userAvatar, chainId, walletType] = getWalletInfo(selectedModal, handleSetWrongNetwork);

  const disconnect = () => {
    provider_disconnect();
    handleClose();
  }

  let connectedToWallet = selectedModal !== 'basic' && selectedModal !== 'error';
  let onWrongChain = connectedToWallet && chainId !== -1 && !TargetChains.includes(chainId);

  return (
    <>
    {show &&
      <div className="connect-modal">
        {selectedModal === "basic" && (
          <Modal.Header closeButton>
            <h5>Connect Wallet</h5>
          </Modal.Header>
        )}

        <Modal.Body>

          {selectedModal === "basic" && (
            <>
              {error === true &&
              <p className="modal-error">Something went wrong with your wallet connection. Try again</p>
              }
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
            <AccountModal2 userAddress={userAddress} ens={userENS} avatar={userAvatar} disconnect={disconnect}/>
          }
        </Modal.Body>
      </div>
      }
      <Modal
            show={showWrongNetwork}
            onHide={handleClose}
            centered
            animation={false}
            className=""
          >
            <WrongNetworkModal handleClose={handleClose} />
      </Modal>
    </>
  );
};

export default ConnectModal;

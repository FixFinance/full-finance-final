import React, { useState, useContext } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "./connectmodal.scss";
import icon1 from "../../assets/image/icon1.svg";
import icon2 from "../../assets/image/icon2.svg";
import icon3 from "../../assets/image/icon3.svg";
import icon4 from "../../assets/image/icon4.svg";
import { Link } from "react-router-dom";
import DepositPopup from "../Deposit & Withdraw Modals/DepositPopup";
import ConnectModal2 from "./ConnectModal2";
import AccountModal2 from "../AccountModals/AccountModal2";
import { EthersContext } from "../EthersProvider/EthersProvider";

import { TargetChains } from '../../Utils/TargetChains.js';

const ConnectModal = ({ handleClose }) => {
  const [show2, setShow2] = useState(false);
  const [selectedModal, setSelectedModal] = useState("basic");
  const [show3, setShow3] = useState(false);
  const [getWalletInfo] = useContext(EthersContext);
  const [provider, userAddress, userETH, userENS, chainId, walletType] = getWalletInfo(selectedModal);

  const openModal3 = () => {
    handleClose();
    setShow3(true);
  };
  const closeModal3 = () => {
    setShow3(false);
  };

  const handleClose2 = () => setShow2(false);
  const handleShow = () => {
    setShow2(true);
    handleClose();
  };

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
        {onWrongChain && (
          <>
            <ConnectModal2 />
          </>
        )}

        {/* <div className="warning_msg">Something went wrong with your wallet connection. Try again text description.</div> */}

        {selectedModal === "basic" && (
          <>
            <div className="form-group">
              <div
                  className="d-flex form-field justify-content-between"
                  onClick={() => {
                    setSelectedModal("metamask");
                    //handleShow();
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

        {selectedModal !== "error" && selectedModal !== "basic" && !onWrongChain && 
          <AccountModal2 walletType={selectedModal} address={userAddress} ens={userENS}/>
        }
      </Modal.Body>
      {/* <Modal
        show={show3}
        onHide={closeModal3}
        centered
        animation={false}
        className="connect-wallet-modal"
      ></Modal> */}
    </div>
  );
};

export default ConnectModal;

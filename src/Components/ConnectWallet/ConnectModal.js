import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "./connectmodal.scss";
import icon1 from "../../assets/image/icon1.svg";
import icon2 from "../../assets/image/icon2.svg";
import icon3 from "../../assets/image/icon3.svg";
import icon4 from "../../assets/image/icon4.svg";
import { Link } from "react-router-dom";
import DepositPopup from "../Deposit & Withdraw Modals/DepositPopup";
import ConnectModal2 from "./WrongNetworkModal";
import AccountModal2 from "../AccountModals/AccountModal2";
const ConnectModal = ({ handleClose }) => {
  const [show2, setShow2] = useState(false);
  const [selectedModal, setSelectedModal] = useState("basic");

  const [show3, setShow3] = useState(false);

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

  return (
    <div className="connect-modal">
      {selectedModal === "basic" && (
        <Modal.Header closeButton>
          <h5>Connect Wallet</h5>
        </Modal.Header>
      )}

      <Modal.Body>
        {selectedModal === "error" && (
          <>
            <ConnectModal2 />
          </>
        )}

        {/* <div className="warning_msg">Something went wrong with your wallet connection. Try again text description.</div> */}

        {selectedModal === "basic" && (
          <>
            <div className="form-group">
              <div className="d-flex form-field justify-content-between">
                <div
                  className="field-text align-self-center"
                  onClick={() => {
                    handleShow();
                  }}
                >
                  Connecting Metamask...
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

        {selectedModal === "walletConnect" && <AccountModal2 />}
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

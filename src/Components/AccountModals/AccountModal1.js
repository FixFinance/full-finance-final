import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import ellips1 from "../../assets/image/ellips1.svg";
import "./accountmodal.scss";
const AccountModal1 = ({ handleClose }) => {
  return (
    <div className="connect-modal account-modal">
      <Modal.Header closeButton>
        <h5>Your wallet</h5>
      </Modal.Header>
      <Modal.Body>
        <img src={ellips1} alt="img" className="ellips" />
        <h5>0x1234567...1234</h5>
        <div className="mb-4 mt-5">
          <div className="text-center">
            <button className="btn common_btn cancel">Copy address</button>
          </div>
          <div className="text-center">
            {" "}
            <button className="btn common_btn switch" onClick={handleClose}>
              Disconnect wallet
            </button>
          </div>
        </div>
      </Modal.Body>
    </div>
  );
};

export default AccountModal1;

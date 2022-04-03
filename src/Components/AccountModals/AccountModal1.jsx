import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import ellips1 from "../../assets/image/ellips1.svg";
import "./accountmodal.scss";
const AccountModal1 = ({ handleClose, address }) => {
  let abbreviatedAddress = address.substring(0, 9)+'...'+address.substring(address.length-4)
  return (
    <div className="connect-modal account-modal">
      <Modal.Header closeButton>
        <h5>Your wallet</h5>
      </Modal.Header>
      <Modal.Body>
        <img src={ellips1} alt="img" className="ellips" />
        <h5>{abbreviatedAddress}</h5>
        <div className="mb-4 mt-5">
          <div className="text-center">
            <button
              className="btn common_btn cancel"
              onClick={() => navigator.clipboard.writeText(address)}
            >
              Copy address
            </button>
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

import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import ellips2 from "../../assets/image/ellips2.svg";
import "./accountmodal.scss";
import AccountModal1 from "./AccountModal1";
const AccountModal2 = ({ handleClose }) => {
  const [modalType, setModalType] = useState("basicColor");

  return (
    <div>
      <div className="connect-modal account-modal">
        {modalType === "basicColor" && (
          <>
            <Modal.Header closeButton>
              <h5>Your wallet</h5>
            </Modal.Header>
            <Modal.Body>
              <img src={ellips2} alt="img" className="ellips" />
              <h5>poydo.eth</h5>
              <h6>0x12345678...123456789</h6>
              <div className="mb-4 mt-5">
                <div className="text-center">
                  <button
                    onClick={() => setModalType("DhikaChikaColor")}
                    className="btn common_btn cancel"
                  >
                    Copy address
                  </button>
                </div>
                <div className="text-center">
                  {" "}
                  <button
                    className="btn common_btn switch"
                    onClick={handleClose}
                  >
                    Disconnect wallet
                  </button>
                </div>
              </div>
            </Modal.Body>
          </>
        )}
        {modalType === "DhikaChikaColor" && (
          <>
            <AccountModal1 />
          </>
        )}
      </div>
    </div>
  );
};

export default AccountModal2;

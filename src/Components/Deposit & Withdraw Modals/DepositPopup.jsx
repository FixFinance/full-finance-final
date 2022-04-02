import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import "./depositmodal.scss";
import SuccessModal from "./SuccessModal";
const DepositPopup = ({ handleClose }) => {
  const [success, setSuccess] = useState(false);

  const handleClosesuccess = () => setSuccess(false);
  const handleShow = () => setSuccess(true);
  return (
    <div className="deposite-withdraw">
      {success ? null : (
        <div>
          <Modal.Header closeButton>
            <h5>Deposit DAI</h5>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center middle_part mt-3">
              <p style={{ color: "#EDF0EB" }}>Amount to deposit</p>
              <div className="form-group mt-3">
                
                <div className="relative">
                <input
                    type="text"
                    className="  form-field"
                    id="exampleInput1"
                    aria-describedby="textHelp"
                    placeholder="       0.00"
                  />
                  <div className="highlight">max</div>
                </div>
                 
               
              </div>
              <div className="d-flex justify-content-between text-part">
                <p style={{ color: "#7D8282" }}>Wallet balance</p>
                <p style={{ color: "#7D8282" }}>12,000.12 DAI</p>
              </div>
            </div>
            <div className="text-center mb-4">
              <button
                className="btn btn-deactive btn-active "
                onClick={handleShow}
              >
                {" "}
                Deposit DAI
              </button>
            </div>
          </Modal.Body>
        </div>
      )}

      <Modal
        show={success}
        onHide={handleClosesuccess}
        centered
        animation={false}
        className="deposit-modal"
      >
        <SuccessModal handleClosesuccess={handleClosesuccess} />
      </Modal>
    </div>
  );
};

export default DepositPopup;

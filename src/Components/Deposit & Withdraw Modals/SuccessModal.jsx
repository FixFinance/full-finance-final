import React from "react";
import Modal from "react-bootstrap/Modal";
import "./depositmodal.scss";
import tick from "../../assets/image/tick.svg";
const SuccessModal = ({ handleClosesuccess }) => {
  return (
    <div className="deposite-withdraw">
      <Modal.Header closeButton>
        <h5>Success</h5>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center middle_part mt-3">
          <img src={tick} alt="img" className="tick_img" />
        </div>
        <div className="text-center mb-4">
          <button className="btn  btn-active " onClick={handleClosesuccess}>
            Ok, close
          </button>
        </div>
      </Modal.Body>
    </div>
  );
};

export default SuccessModal;

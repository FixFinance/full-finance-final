import React from "react";
import Modal from "react-bootstrap/Modal";
import "./connectmodal.scss";
import { DefaultChain, DefaultChainName } from "../../Utils/TargetChains.js";

const WrongNetworkModal = ({handleClose}) => {

  const changeToDefault = async () => {
    // TODO: switch chain
    handleClose();
  }

  return (
    <div>
      <div className="connect-modal">
        <Modal.Header closeButton>
          <h5>Wrong Network</h5>
        </Modal.Header>
        <Modal.Body>

           <h6>Connect to appropriate chain.</h6>
           <div className="_margin_">
           <div className="text-center"><button className="btn common_btn cancel" onClick={handleClose}>Cancel</button></div>
           <div className="text-center"> <button className="btn common_btn switch" onClick={changeToDefault}>Switch to {DefaultChainName}</button></div>
           </div>

        </Modal.Body>
      </div>
    </div>
  );
};

export default WrongNetworkModal;


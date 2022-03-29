import React from "react";
import Modal from "react-bootstrap/Modal";
import "./connectmodal.scss";
const ConnectModal2 = ({handleClose2}) => {
  return (
    <div>
      <div className="connect-modal">
        <Modal.Header closeButton>
          <h5>Wrong Network</h5>
        </Modal.Header>
        <Modal.Body>
            
           <h6>Connect to appropriate Mainnet chain.</h6>
           <div className="_margin_">
           <div className="text-center"><button className="btn common_btn cancel" onClick={handleClose2}>Cancel</button></div>
           <div className="text-center"> <button className="btn common_btn switch">Switch to Mainnet</button></div>
           </div>
          
          
        </Modal.Body>
      </div>
    </div>
  );
};

export default ConnectModal2;


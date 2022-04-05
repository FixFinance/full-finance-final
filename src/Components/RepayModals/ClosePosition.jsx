import React from 'react';
import Modal from "react-bootstrap/Modal";

const ClosePosition=({ handleClose5 })=> {
  return (
    <div className="deposite-withdraw">
    <div>
      <Modal.Header closeButton>
        <h5>Close Position (DAI/wETH)</h5>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center middle_part mt-3">
        <div className="text-center">
            <div className="text-part" style={{ "fontSize": "24px" ,color: "#7D8282", "maxWidth": "300px", margin: "auto", "marginBottom": "60px" }}>To close position you need to repay full debt amount</div>
        </div>
          <p style={{ color: "#EDF0EB" }}>Amount to Repay</p>
          <div className="form-group mt-3">
          <div className="relative">
                <input
                    type="text"
                    className="  form-field"
                    id="exampleInput1"
                    aria-describedby="textHelp"
                    placeholder="2,000.00"
                  />
                  <div className="highlight">max</div>
                </div>
          </div>
          <div className="d-flex justify-content-between text-part">
            <p style={{ color: "#7D8282" }}>Current debt</p>
            <p style={{ color: "#7D8282" }}>2,000.00 DAI</p>
          </div>
        </div>
        <div className="text-center mb-4">
          <button className="btn btn-deactive btn-active " style={{ background: "#EF767A"}}>Close DAI/WETH Position</button>
        </div>
        </Modal.Body>
    </div>
    </div>

    )
}

export default ClosePosition;
import React from "react";
import Modal from "react-bootstrap/Modal";

const AddCollateral = ({ handleClose1 }) => {
  return (
    <div className="deposite-withdraw">
      <div>
        <Modal.Header closeButton>
          <h5>Add Collateral</h5>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center middle_part mt-3">
            <p style={{ color: "#EDF0EB" }}>Collateral Amount</p>
            <div className="form-group mt-3">
            <div className="relative">
                <input
                    type="text"
                    className="  form-field"
                    id="exampleInput1"
                    aria-describedby="textHelp"
                    placeholder="|0.00"
                  />
                  <div className="highlight">max</div>
                </div>
            </div>
            <div className="d-flex justify-content-between text-part">
              <p style={{ color: "#7D8282" }}>Wallet balance</p>
              <p style={{ color: "#7D8282" }}>400.12345 wETH</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={{ color: "#7D8282" }}>Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>150%</p>
            </div>
            <div className="d-flex justify-content-between text-part mt-2">
              <p style={{ color: "#7D8282" }}>Min. Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>120%</p>
            </div>
          </div>

          <div className="text-center mb-4">
            <button className="btn btn-deactive btn-active "> Add wETH</button>
          </div>
        </Modal.Body>
      </div>
    </div>
  );
};

export default AddCollateral;

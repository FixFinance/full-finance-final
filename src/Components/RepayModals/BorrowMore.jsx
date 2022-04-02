import React from 'react';
import Modal from "react-bootstrap/Modal";

const BorrowMore=({ handleClose4 })=> {
  return (
    <div className="deposite-withdraw">
    <div>
      <Modal.Header closeButton>
        <h5>Borrow More</h5>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center middle_part mt-3">
          <p style={{ color: "#EDF0EB" }}>Amount to Borrow</p>
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
            <p style={{ color: "#7D8282" }}>Available</p>
            <p style={{ color: "#7D8282" }}>500.00 DAI</p>
          </div>
          <div className="d-flex justify-content-between text-part border_bottom">
            <p style={{ color: "#7D8282" }}>Debt amount</p>
            <div>
              <p style={{ color: "#7D8282" }}>2,000.00 DAI</p>
              {/* <p style={{ color: "#7D8282" }}>→ 500.00 DAI</p> */}
            </div>
          </div>
          <div className="d-flex justify-content-between text-part mt-2 border_bottom">
            <p style={{ color: "#7D8282" }}>Coll. Ratio</p>
            <p style={{ color: "#7D8282" }}>200%</p>
          </div>
          <div className="d-flex justify-content-between text-part mt-2">
            <p style={{ color: "#7D8282" }}>Min. Coll. Ratio</p>
            <p style={{ color: "#7D8282" }}>120%</p>
          </div>
        </div>

        <div className="text-center mb-4">
          <button className="btn btn-deactive btn-active "> Borrow DAI</button>
        </div>
      </Modal.Body>
    </div>
  </div>
  )
}

export default BorrowMore;
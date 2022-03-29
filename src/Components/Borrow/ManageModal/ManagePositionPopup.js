import React from 'react'
import Modal from "react-bootstrap/Modal";
import "./managepopup.scss";


 const ManagePositionPopup=({ handleClose })=> {
  return (
    <div>
        <div className="manage_popup">
            <Modal.Header closeButton>
            <h5>Open Borrowing Position</h5>
            </Modal.Header>
            <Modal.Body>
               <div className="managepopup_details">
                   <div className="amount_section">
                        <h5>1/3</h5>
                        <h4>Enter collateral amount</h4>
                        <div className="input_section">
                            <input type="text" placeholder="10.00"/>
                            <bottun className="btn">max</bottun>
                        </div>
                        <h3>Wallet balance <span>400.12345 wETH</span></h3>
                   </div>

                   <div className="amount_section">
                        <h5>2/3</h5>
                        <h4>Choose an Asset to Borrow</h4>
                        <div className="input_section">
                            <select>
                                <option>Choose Asset</option>
                                <option>Choose Asset</option>
                                <option>Choose Asset</option>
                                <option>Choose Asset</option>
                            </select>
                        </div>
                        <h3>Wallet balance <span>400.12345 wETH</span></h3>
                   </div>

                   <div className="amount_section">
                        <h5>3/3</h5>
                        <h4>Enter an Amount to borrow</h4>
                        <div className="input_section">
                            <input type="text" placeholder="00.00"/>
                        </div>
                        <h3>Available to borrow <span>—</span></h3>

                        <div className="amount_section_text">
                            <h3>Available to borrow <span>—</span></h3>
                            <h3>Available to borrow <span>—</span></h3> 
                        </div>
                   </div>

                   <button className="btn activate">Enter Collateral amount</button>
                   <button className="btn diactivate">Borrow DAI</button>
               </div> 
            </Modal.Body>
        </div>
    </div>
  )
}
export default ManagePositionPopup
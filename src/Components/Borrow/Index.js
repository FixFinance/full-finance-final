import React, { useState } from "react";
import "./borrow.scss";
import debt_icon from "../../assets/image/rupee.svg";
import collateral_value from "../../assets/image/collateral_value.svg";
import ratio_question from "../../assets/image/ratio_question.svg";
import t_icon from "../../assets/image/t_icon.png";
import Modal from "react-bootstrap/Modal";
import ManagePopup from './ManageModal/ManagePopup';
import ManagePositionPopup from './ManageModal/ManagePositionPopup';

function Index() {
  const [modal1, setModal1] = useState(false);

  const handleClose1 = () => setModal1(false);
  const handleShow1 = () => setModal1(true);
  
  return (
    <div>
      <section className="borrow_section">
        <div className="container">
        <div className="row">
          <div className="col-lg-4 col-md-4">
            <div className="borrow_box">
              <h5>Your vaults</h5>
              <div className="borrow_box_text">
                <h2>12 %</h2>
                <p>borrow fixed APR</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_box">
              <h5>Your vaults</h5>
              <div className="borrow_box_text">
                <h2>12 %</h2>
                <p>borrow fixed APR</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_box_add">
              <div className="plus_added">
                <button>+</button>
                <p>open Borrowing positions</p>
              </div>
            </div>
          </div>
        </div>
        </div>
        
      </section>

      <section>
        <div className="row borrow_position">
            <div className="borrow_stablecoins">
              <h5>Borrow Stablecoins against wETH at 12% fixed rate</h5>
              <ul>
                <li><img src={debt_icon} alt=""/></li>
                <li><img src={collateral_value} alt=""/></li>
                <li><img src={t_icon} alt=""/></li>
                <li><button>+</button></li>
              </ul>
            </div>
        </div>
      </section>

      <section>
        <div className="row borrow_position">
            <h4>Your borrowing positions</h4>
            <div className="row borrow_position_wrap">
              <h4>DAI / wETH</h4>
              <div className="col-lg-4 col-md-4">
                <div className="borrow_position_box">
                  <h5>Total debt</h5>
                  <h2><img src={debt_icon} alt="img" className="debt_icon"/> 10,000.00 DAI</h2>
                  <p>~ $ 9,999.98</p>
                </div>
              </div>
              <div className="col-lg-4 col-md-4">
                <div className="borrow_position_box">
                  <h5>Collateral Value</h5>
                  <h2><img src={collateral_value} alt=""/> 200.00 wETH</h2>
                  <p>~ $ 25,834.09</p>
                </div>
              </div>
              <div className="col-lg-4 col-md-4">
                <div className="borrow_position_box">
                  <h5>Collateralization ratio <span><img src={ratio_question} alt=""/></span></h5>
                  <h2>258%</h2>
                  <p>120% min. collateralization ratio</p>
                </div>
              </div>
              <div className="col-lg-12 col-md-12">
                <div className="borrow_position_box total_debt_box">
                  <h5>Total debt</h5>
                </div>
              </div>
            </div>

            <div className="row borrow_position_wrap">
              <h4>USDC / wETH</h4>
              <div className="col-lg-4 col-md-4">
                <div className="borrow_position_box">
                  <h5>Total debt</h5>
                  <h2><img src={debt_icon} alt="img" className="debt_icon"/> 1,000.00 USDC</h2>
                  <p>~ $ 9,999.98</p>
                </div>
              </div>
              <div className="col-lg-4 col-md-4">
                <div className="borrow_position_box">
                  <h5>Collateral Value</h5>
                  <h2><img src={collateral_value} alt=""/> 200.00 wETH</h2>
                  <p>~ $ 25,834.09</p>
                </div>
              </div>
              <div className="col-lg-4 col-md-4">
                <div className="borrow_position_box">
                  <h5>Collateralization ratio <span><img src={ratio_question} alt=""/></span></h5>
                  <h2>128% (need action)</h2>
                  <p>120% min. collateralization ratio</p>
                </div>
              </div>
              <div className="col-lg-12 col-md-12">
                <div className="borrow_position_box total_debt_box">
                  <button onClick={handleShow1}><h5>Manage position</h5></button>
                  {/* <button onClick={handleShow2}><h5>Manage position</h5></button> */}
                </div>
              </div>
            </div>
        </div>
      </section> 

        <Modal
          show={modal1}
          onHide={handleClose1}
          centered
          animation={false}
          className="deposit-modal"
        >
          <ManagePopup handleClose={handleClose1} />
        </Modal>

       
    </div>
  )
}

export default Index;
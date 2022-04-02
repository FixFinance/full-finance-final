import React, { useState } from "react";
import question from "../../assets/image/question.svg";
import rupee from "../../assets/image/rupee.svg";
import Modal from "react-bootstrap/Modal";
import DepositPopup from "../Deposit & Withdraw Modals/DepositPopup";
import WithdrawModal from "../Deposit & Withdraw Modals/WithdrawModal";
const EmptyState = () => {
    const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show2, setShow2] = useState(false);

  const handleClose2 = () => setShow2(false);
  const handleShow2 = () => setShow2(true);
  return (
    <div className="empty">
      <div>
        <div className="d-flex justify-content-between">
          <span>Your Deposit Balance</span>
          <img src={question} alt="img" className="question_img" />
        </div>
        <div className="flex_class margin_small">
          <div className="d-flex">
            <div className="d-block">
              <img src={rupee} alt="img" className="rupee_img" />
              <p>$0.00</p>
            </div>
            <h5>0.00</h5>
            <h5>DAI</h5>
          </div>
          <div className="">
            <h5 className="m-0">12.10 %</h5>
            <p className="text-white ">Deposit APR</p>
          </div>
        </div>
        <div className="margin_small">
          <div className="text-center">
            <button className="btn common_btn deposit" onClick={handleShow}>Deposit DAI</button>
          </div>
          <div className="text-center">
            <button className="btn common_btn withdraw" onClick={handleShow2}>Withdraw DAI</button>
          </div>
        </div>
      </div>
      <Modal
          show={show}
          onHide={handleClose}
          centered
          animation={false}
          className="deposit-modal"
        >
          <DepositPopup handleClose={handleClose} />
        </Modal>
        <Modal
          show={show2}
          onHide={handleClose2}
          centered
          animation={false}
          className="deposit-modal"
        >
          <WithdrawModal handleClose2={handleClose2} />
        </Modal>
    </div>
  );
};

export default EmptyState;

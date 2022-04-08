import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import AddCollateral from "../../Collateral Modals/AddCollateral";
import WithdrawCollateral from "../../Collateral Modals/WithdrawCollateral";
import BorrowMore from "../../RepayModals/BorrowMore";
import Debt from "../../RepayModals/Debt";
import ClosePosition from "../../RepayModals/ClosePosition";
import "./managepopup.scss";
import ManagePositionPopup from './ManagePositionPopup';
import { ethers, BigNumber as BN } from 'ethers';
import { ADDRESS0 } from '../../../Utils/Consts.js';

const IERC20ABI = require('../../../abi/IERC20.json');

const ManagePopup = ({
  handleClose,
  provider,
  userAddress,
  CMM,
  userVaults,
  supplyBorrowed,
  supplyBorrowShares,
  baseAggAnswer,
  baseAggDecimals,
  collateralAggAnswer,
  collateralAggDecimals
}) => {
  const [modalType, setModalType] = useState("basic");
  const handleModalType = (type) => {
    setModalType(type);
  };
  const [modal2, setModal2] = useState(false);

  const handleClose2 = () => setModal2(false);
  const handleShow2 = () => setModal2(true);

  const allInitialized =
    provider !== null &&
    userAddress !== ADDRESS0 &&
    CMM !== null &&
    userVaults !== null;

  const signer = provider == null ? null : provider.getSigner();

  let DAI = signer == null ? null : new ethers.Contract(process.env.REACT_APP_BASE_ASSET_ADDRESS, IERC20ABI, signer);
  let CASSET = signer == null ? null : new ethers.Contract(process.env.REACT_APP_COLLATERAL_ADDRESS, IERC20ABI, signer);

  return (
    <>
      {modalType === "basic" && (
        <div>
          <div className="manage_popup">
            <Modal.Header closeButton>
              <h5>Withdraw DAI</h5>
            </Modal.Header>
            <Modal.Body>
              <div className="managepopup_details">
                <p className="errorr_message">
                  There is not enough collateral to withdraw or borrow. Please
                  repay your debt, or add more collatral to avoid liquidation.
                </p>
                <button
                  className="btn"
                  onClick={() => handleModalType("repay")}
                >
                  Repay Debt
                </button>
                <button onClick={() => handleModalType("add")} className="btn">
                  Add Collateral
                </button>
                <button
                  onClick={() => handleModalType("Withdraw")}
                  className="btn active"
                >
                  Withdraw Collateral
                </button>
                <button
                  onClick={() => handleModalType("borrowMore")}
                  className="btn active"
                >
                  Borrow More
                </button>
                <button
                  onClick={() => handleModalType("closePosition")}
                  className="btn close"
                >
                  Close Position
                </button>
                <button
               
                  className="btn link"
                  onClick={handleShow2}
                >
                  FAQ link
                </button>
              </div>
            </Modal.Body>
          </div>
        </div>
      )}
      {modalType === "add" && <AddCollateral />}
      {modalType === "Withdraw" && <WithdrawCollateral />}{" "}
      {(modalType === "debt" || modalType === "repay") && <Debt />}{" "}
      {modalType === "borrowMore" && <BorrowMore />}
      {modalType === "closePosition" && <ClosePosition />}
      <Modal
          show={modal2}
          onHide={handleClose2}
          centered
          animation={false}
          className="deposit-modal"
        >
          <ManagePositionPopup handleClose={handleClose2} />
        </Modal>
    </>
  );
};
export default ManagePopup;

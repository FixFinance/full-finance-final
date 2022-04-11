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
import { ADDRESS0, TOTAL_SBPS } from '../../../Utils/Consts.js';

const IERC20ABI = require('../../../abi/IERC20.json');

const ManagePopup = ({
  handleClose,
  provider,
  userAddress,
  CMM,
  DAI,
  CASSET,
  supplyBorrowed,
  supplyBorrowShares,
  vault,
  forceUpdateVault
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
    vault !== null;

  const hasGoodCollatRatio = vault == null ? true : vault.collateralizationRatio.mul(BN.from(100)).div(TOTAL_SBPS).gte(BN.from(process.env.REACT_APP_COLLATERALIZATION_FACTOR).add(BN.from(5)));

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
                {!hasGoodCollatRatio && <p className="errorr_message">
                  "There is not enough collateral to withdraw or borrow. Please
                  repay your debt, or add more collatral to avoid liquidation.
                </p>}
                <button
                  className="btn"
                  onClick={() => handleModalType("repay")}
                >
                  Repay Debt
                </button>
                <button
                  className="btn"
                  onClick={() => handleModalType("add")}
                >
                  Add Collateral
                </button>
                <button
                  onClick={() => hasGoodCollatRatio ? handleModalType("Withdraw") : ""}
                  className={hasGoodCollatRatio ? "btn" : "btn active"}
                >
                  Withdraw Collateral
                </button>
                <button
                  onClick={() => hasGoodCollatRatio ? handleModalType("borrowMore") : ""}
                  className={hasGoodCollatRatio ? "btn" : "btn active"}
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
      {modalType === "add" && <AddCollateral userAddress={userAddress} CMM={CMM} CASSET={CASSET} vault={vault} forceUpdateVault={forceUpdateVault}/>}
      {modalType === "Withdraw" && hasGoodCollatRatio && <WithdrawCollateral userAddress={userAddress} CMM={CMM} CASSET={CASSET} vault={vault} forceUpdateVault={forceUpdateVault}/>}{" "}
      {(modalType === "debt" || modalType === "repay") && <Debt userAddress={userAddress} CMM={CMM} DAI={DAI} vault={vault} forceUpdateVault={forceUpdateVault}/>}{" "}
      {modalType === "borrowMore" && hasGoodCollatRatio && <BorrowMore userAddress={userAddress} CMM={CMM} DAI={DAI}  vault={vault} forceUpdateVault={forceUpdateVault}/>}
      {modalType === "closePosition" && <ClosePosition handleClose={handleClose} userAddress={userAddress} CMM={CMM} DAI={DAI} vault={vault}/>}
    </>
  );
};
export default ManagePopup;

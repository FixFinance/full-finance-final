import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import AddCollateral from "../../Collateral Modals/AddCollateral";
import WithdrawCollateral from "../../Collateral Modals/WithdrawCollateral";
import BorrowMore from "../../RepayModals/BorrowMore";
import Debt from "../../RepayModals/Debt";
import "./managepopup.scss";
import { ethers, BigNumber as BN } from 'ethers';
import { ADDRESS0, TOTAL_SBPS, GOOD_COLLAT_RATIO_MULTIPLIER } from '../../../Utils/Consts';
import { ENV_TICKERS, ENV_ASSETS } from '../../../Utils/Env';

const IERC20ABI = require('../../../abi/IERC20.json');

const ManagePopup = ({
  handleClose,
  signer,
  userAddress,
  envIndex,
  basicInfo
}) => {
  const [modalType, setModalType] = useState("basic");

  const [modal2, setModal2] = useState(false);

  const handleClose2 = () => setModal2(false);
  const handleShow2 = () => setModal2(true);

  const {
    vault,
    vaultDetails
  } = basicInfo;

  const ASSET = ENV_ASSETS[envIndex];

  const assetSpecifics = vaultDetails === null ? null : vaultDetails[ASSET];

  const allInitialized =
    ![signer, vault, vaultDetails].includes(null) &&
    userAddress !== ADDRESS0;

  const hasGoodCollatRatio = !allInitialized ||
    parseFloat(vaultDetails.effCollateralizationRatioString)-1 > 
      (parseFloat(vaultDetails.requiredCollateralizationRatioString)-1) * GOOD_COLLAT_RATIO_MULTIPLIER;

  const isBorrowed = allInitialized && assetSpecifics.isBorrowed;
  const isSupplied = allInitialized && assetSpecifics.isSupplied;
  const openPosition = !isBorrowed && !isSupplied;

  let Buttons = openPosition ? 
    (
      <>
        <button
          className="btn"
          onClick={() => hasGoodCollatRatio ? setModalType("Borrow") : ""}
        >
          Borrow
        </button>
        <button
          className={hasGoodCollatRatio ? "btn" : "btn active"}
          onClick={() => setModalType("Supply")}
        >
          Supply
        </button>
      </>
    )
      :
    (
      <>
        { isSupplied &&
          (
            <>
              <button
                className="btn"
                onClick={() => setModalType("Supply")}
              >
                Add Collateral
              </button>
              <button
                className={hasGoodCollatRatio ? "btn" : "btn active"}
                onClick={() => hasGoodCollatRatio ? setModalType("Withdraw") : ""}
              >
                Remove Collateral
              </button>
            </>
          )        
        }

        { isBorrowed &&
          (
            <>
              <button
                  className={hasGoodCollatRatio ? "btn" : "btn active"}
                  onClick={() => hasGoodCollatRatio ? setModalType("Borrow") : ""}
              >
                Borrow More
              </button>
              <button
                className="btn"
                onClick={() => setModalType("Repay")}
              >
                Repay Debt
              </button>
            </>
          )        
        }
      </>
    );

  return (
    <>
      {modalType === "basic" && (
        <div>
          <div className="manage_popup">
            <Modal.Header closeButton>
              <h5>Withdraw DAI</h5>
            </Modal.Header>
            <Modal.Body style={!hasGoodCollatRatio ? { height: "550px" } : {height: "500px"}}>
              <div className="managepopup_details">
                {!hasGoodCollatRatio && <p className="error_message">
                  "There is not enough collateral to withdraw or borrow. Please
                  repay your debt, or add more collatral to avoid liquidation.
                </p>}

                {Buttons}

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
      {modalType === "Supply" &&
        <AddCollateral handleClose={handleClose} userAddress={userAddress} signer={signer} envIndex={envIndex} basicInfo={basicInfo}/>
      }
      {modalType === "Withdraw" && hasGoodCollatRatio &&
        <WithdrawCollateral handleClose={handleClose} userAddress={userAddress} signer={signer} envIndex={envIndex} basicInfo={basicInfo}/>
      }{" "}
      {modalType === "Repay" &&
        <Debt handleClose={handleClose} userAddress={userAddress} signer={signer} envIndex={envIndex} basicInfo={basicInfo}/>
      }{" "}
      {modalType === "Borrow" && hasGoodCollatRatio &&
        <BorrowMore handleClose={handleClose} userAddress={userAddress} signer={signer} envIndex={envIndex} basicInfo={basicInfo}/>
      }
    </>
  );
};
export default ManagePopup;

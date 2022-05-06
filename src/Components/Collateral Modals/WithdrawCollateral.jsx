import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import SuccessModal from "../Success/SuccessModal";
import { TOTAL_SBPS, INF, _0 } from '../../Utils/Consts';
import { SendTx } from '../../Utils/SendTx';
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';


const WithdrawCollateral = ({
  handleClose,
  userAddress,
  CMM,
  CASSET,
  vault,
  forceUpdateVault
}) => {
  const [success, setSuccess] = useState(false);
  const [input, setInput] = useState('');

  const minCollatRatioBN = BN.from(parseInt(process.env.REACT_APP_COLLATERALIZATION_FACTOR)+5).mul(BN.from(10).pow(BN.from(16)));
  const minimumCollateral = BN.from(vault.amountSupplied).mul(minCollatRatioBN).div(vault.collateralizationRatio);
  const absInputAmt = BN.from(getAbsoluteString(input, parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS)));
  const impliedAmountSupplied = vault.amountSupplied.sub(absInputAmt);
  const impliedCollateralizationRatio = vault.collateralizationRatio.mul(impliedAmountSupplied).div(vault.amountSupplied);

  const amtSuppliedStringAbbreviated = getDecimalString(vault.amountSupplied.toString(), parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS), 5);
  const currentCollRatioString = vault.collateralizationRatio == null ? '0' : getDecimalString(vault.collateralizationRatio.toString(), 16, 2);
  const impliedCollRatioString = getDecimalString(impliedCollateralizationRatio.toString(), 16, 2);

  const MIN_SAFE_COLLAT_RATIO = BN.from(process.env.REACT_APP_COLLATERALIZATION_FACTOR).add(BN.from(5)).mul(BN.from(10).pow(BN.from(16)));
  let resultantCollatRatioSafe = impliedCollateralizationRatio.gte(MIN_SAFE_COLLAT_RATIO);

  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value);
    setInput(filteredValue);
  }

  const handleClickWithdraw = async () => {
    if (absInputAmt.gt(_0) && impliedAmountSupplied.gte(minimumCollateral)) {
      await SendTx(userAddress, CMM, 'withdrawFromCVault', [vault.index, absInputAmt.toString()]);
      setSuccess(true);
    }
  }

  const BaseContents = (
    !success &&
    <div className="deposite-withdraw">
      <div>
        <Modal.Header closeButton>
          <h5>Withdraw collateral</h5>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center middle_part mt-3">
            <p style={{ color: "#EDF0EB" }}>Amount to withdraw</p>
            <div className="form-group mt-3">
            <div className="relative">
                <input
                    type="text"
                    className="  form-field"
                    id="exampleInput1"
                    aria-describedby="textHelp"
                    placeholder="00.00"
                    value={input}
                    onChange={handleInput}
                  />
                </div>
            </div>
            <div className="d-flex justify-content-between text-part">
              <p style={{ color: "#7D8282" }}>Current Collateral</p>
              <p style={{ color: "#7D8282" }}>{amtSuppliedStringAbbreviated} WETH</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>Implied Coll. Ratio</p>
              <p style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>{impliedCollRatioString}%</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>Current Coll. Ratio</p>
              <p style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>{currentCollRatioString}%</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={{ color: "#7D8282" }}>Min. Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{parseInt(process.env.REACT_APP_COLLATERALIZATION_FACTOR)+5}%</p>
            </div>
            <div className="d-flex justify-content-between text-part mt-2">
              <p style={{ color: "#7D8282" }}>Liquidation Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{process.env.REACT_APP_COLLATERALIZATION_FACTOR}%</p>
            </div>
          </div>

          <div className="text-center mb-4">
            <button className="btn btn-deactive btn-active " onClick={handleClickWithdraw}>
              {" "}
              Withdraw wETH
            </button>
          </div>
        </Modal.Body>
      </div>
    </div>
  );

  const successmodal = (
    <Modal
        show={success}
        onHide={handleClose}
        centered
        animation={false}
        className="deposit-modal"
    >
        <SuccessModal handleClosesuccess={handleClose} />
    </Modal>
  );

  return (
    <>
      {BaseContents}
      {successmodal}
    </>
  );
};

export default WithdrawCollateral;

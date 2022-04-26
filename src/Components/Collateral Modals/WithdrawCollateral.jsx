import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import { TOTAL_SBPS, INF, _0 } from '../../Utils/Consts';
import { SendTx } from '../../Utils/SendTx';
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';


const WithdrawCollateral = ({
  userAddress,
  CMM,
  CASSET,
  vault,
  forceUpdateVault
}) => {

  const [input, setInput] = useState('');

  const minCollatRatioBN = BN.from(parseInt(process.env.REACT_APP_COLLATERALIZATION_FACTOR)+5).mul(BN.from(10).pow(BN.from(16)));
  const minimumCollateral = BN.from(vault.amountSupplied).mul(minCollatRatioBN).div(vault.collateralizationRatio);
  const absInputAmt = BN.from(getAbsoluteString(input, parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS)));
  const impliedAmountSupplied = vault.amountSupplied.sub(absInputAmt);
  const impliedCollateralizationRatio = vault.collateralizationRatio.mul(impliedAmountSupplied).div(vault.amountSupplied);

  const amtSuppliedStringAbbreviated = getDecimalString(vault.amountSupplied.toString(), parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS), 5);
  const currentCollRatioString = vault.collateralizationRatio == null ? '0' : getDecimalString(vault.collateralizationRatio.toString(), 16, 2);
  const impliedCollRatioString = getDecimalString(impliedCollateralizationRatio.toString(), 16, 2);

  const [collatRatioCheck, setCollatRatioCheck] = useState(false); // This variable controls the color of the Implied Collateralization Ratio

  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value);
    setInput(filteredValue);
  }

  const handleClickWithdraw = async () => {
    if (absInputAmt.gt(_0) && impliedAmountSupplied.gte(minimumCollateral)) {
      await SendTx(userAddress, CMM, 'withdrawFromCVault', [vault.index, absInputAmt.toString()]);
      forceUpdateVault();
      setInput('');
    }
  }

  return (
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
              <p style={!collatRatioCheck ? { color: "#EF767A" } : { color: "#7D8282" }}>Implied Coll. Ratio</p>
              <p style={!collatRatioCheck ? { color: "#EF767A" } : { color: "#7D8282" }}>{impliedCollRatioString}%</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={!collatRatioCheck ? { color: "#EF767A" } : { color: "#7D8282" }}>Current Coll. Ratio</p>
              <p style={!collatRatioCheck ? { color: "#EF767A" } : { color: "#7D8282" }}>{currentCollRatioString}%</p>
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
};

export default WithdrawCollateral;

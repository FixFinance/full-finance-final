import React, {useState, useEffect} from "react";
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import { TOTAL_SBPS, INF, _0, INF_CHAR } from '../../Utils/Consts';
import { SendTx } from '../../Utils/SendTx';
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';

const Debt = ({
  userAddress,
  CMM,
  DAI,
  vault,
  forceUpdateVault
}) => {

  const [input, setInput] = useState('');
  const [balanceDASSET, setBalanceDASSET] = useState(null);
  const [approvalDASSET, setAllowanceDASSET] = useState(null);
  const [maxClicked, setMaxClicked] = useState(false);

  useEffect(() => {
    if (balanceDASSET == null) {
      DAI.balanceOf(userAddress).then(res => setBalanceDASSET(res));
    }
    if (approvalDASSET == null) {
      DAI.allowance(userAddress, CMM.address).then(res => setAllowanceDASSET(res));
    }
  }, [balanceDASSET, approvalDASSET]);

  const absInputAmt = BN.from(getAbsoluteString(input.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS)));
  const impliedBorrowObligation = vault.borrowObligation.sub(absInputAmt);
  const resultantCollateralizationRatio = vault.collateralizationRatio.mul(vault.borrowObligation).div(impliedBorrowObligation);

  const borrowObligationString = getDecimalString(vault.borrowObligation.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 5);
  const balanceDAIString = balanceDASSET == null ? '0' : getDecimalString(balanceDASSET.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 2);
  const currentCollRatioString = getDecimalString(vault.collateralizationRatio.toString(), 16, 2);
  const resultantCollRatioString = impliedBorrowObligation.lte(_0) ? INF_CHAR : getDecimalString(resultantCollateralizationRatio.toString(), 16, 2);

  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value);
    setInput(filteredValue);
    if (maxClicked) {
      setMaxClicked(false);
    }
  }

  const handleClickMax = () => {
    setInput(borrowObligationString);
    setMaxClicked(true);
  }

  const handleClickRepay = async () => {
    if (balanceDASSET != null && approvalDASSET != null && balanceDASSET.gte(absInputAmt)) {
      if (maxClicked) {
        await SendTx(CMM.repayCVault(vault.index, vault.borrowSharesOwed, false));
      }
      else {
        await SendTx(CMM.repayCVault(vault.index, absInputAmt, true));
      }
      forceUpdateVault();
      setBalanceDASSET(null);
      setAllowanceDASSET(null);
      setMaxClicked(false);
      setInput('');
    }
  }

  const handleClickApprove = async () => {
    if (balanceDASSET != null && approvalDASSET != null) {
      await SendTx(DAI.approve(CMM.address, INF));
      setAllowanceDASSET(null);
    }
  }

  const sufficientApproval = balanceDASSET != null && approvalDASSET != null && approvalDASSET.gte(absInputAmt);

  const buttonMessage = sufficientApproval ? "Repay DAI" : "Approve DAI";
  const onClick = sufficientApproval ? handleClickRepay : handleClickApprove;

  return (
    <div className="deposite-withdraw">
      <div>
        <Modal.Header closeButton>
          <h5>Repay Debt</h5>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center middle_part mt-3">
            <p style={{ color: "#EDF0EB" }}>Amount to repay</p>
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
                  <div className="highlight" onClick={handleClickMax}>max</div>
                </div>
            </div>
            <div className="d-flex justify-content-between text-part">
              <p style={{ color: "#7D8282" }}>Current debt</p>
              <p style={{ color: "#7D8282" }}>{borrowObligationString} DAI</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={{ color: "#7D8282" }}>Balance DAI</p>
              <div>
                <p style={{ color: "#7D8282" }}>{balanceDAIString} DAI</p>
              </div>
            </div>
            <div className="d-flex justify-content-between text-part mt-2 border_bottom">
              <p style={{ color: "#7D8282" }}>Resultant Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{resultantCollRatioString}%</p>
            </div>

            <div className="d-flex justify-content-between text-part mt-2 border_bottom">
              <p style={{ color: "#7D8282" }}>Current Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{currentCollRatioString}%</p>
            </div>

            <div className="d-flex justify-content-between text-part mt-2">
              <p style={{ color: "#7D8282" }}>Liquidation Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{process.env.REACT_APP_COLLATERALIZATION_FACTOR}%</p>
            </div>
          </div>

          <div className="text-center mb-4">
            <button className="btn btn-deactive btn-active " onClick={onClick}>{buttonMessage}</button>
          </div>
        </Modal.Body>
      </div>
    </div>
  );
};

export default Debt;

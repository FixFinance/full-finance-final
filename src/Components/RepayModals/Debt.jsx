import React, {useState, useEffect} from "react";
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import SuccessModal from "../Success/SuccessModal";
import { TOTAL_SBPS, INF, _0, INF_CHAR } from '../../Utils/Consts';
import { SendTx } from '../../Utils/SendTx';
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';

const Debt = ({
  handleClose,
  userAddress,
  CMM,
  DAI,
  vault,
  forceUpdateVault
}) => {
  const SUCCESS_STATUS = {
    BASE: 0,
    APPROVAL_SUCCESS: 1,
    REPAY_SUCCESS: 2
  }
  const [success, setSuccess] = useState(SUCCESS_STATUS.BASE);

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

  const borrowObligationString = getDecimalString(vault.borrowObligation.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 3);
  const balanceDAIString = balanceDASSET == null ? '0' : getDecimalString(balanceDASSET.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 3);
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
        await SendTx(userAddress, CMM, 'repayCVault', [vault.index, vault.borrowSharesOwed.toString(), false]);
      }
      else {
        await SendTx(userAddress, CMM, 'repayCVault', [vault.index, absInputAmt.toString(), true]);
      }
      setSuccess(SUCCESS_STATUS.REPAY_SUCCESS);
    }
  }

  const handleClickApprove = async () => {
    if (balanceDASSET != null && approvalDASSET != null) {
      await SendTx(userAddress, DAI, 'approve', [CMM.address, INF.toString()]);
      setSuccess(SUCCESS_STATUS.APPROVAL_SUCCESS);
      setMaxClicked(false);
      setInput('');
    }
  }

  const handleClosesuccess = () => {
    if (success == SUCCESS_STATUS.APPROVAL_SUCCESS) {
      setAllowanceDASSET(null);
      setSuccess(SUCCESS_STATUS.BASE);
    }
    else {
      handleClose();
    }
  }

  const sufficientApproval = balanceDASSET == null || approvalDASSET == null || (approvalDASSET.gte(absInputAmt) && !approvalDASSET.eq(_0));

  const buttonMessage = sufficientApproval ? "Repay DAI" : "Approve DAI";
  const onClick = sufficientApproval ? handleClickRepay : handleClickApprove;

  const BaseContents = (
    success === SUCCESS_STATUS.BASE &&
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

  const successmodal = (
    <Modal
        show={success !== SUCCESS_STATUS.BASE}
        onHide={handleClosesuccess}
        centered
        animation={false}
        className="deposit-modal"
    >
        <SuccessModal handleClosesuccess={handleClosesuccess} />
    </Modal>
  );

  return (
    <>
      {BaseContents}
      {successmodal}
    </>
  );
};

export default Debt;

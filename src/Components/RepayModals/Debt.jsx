import React, {useState, useContext, useEffect} from "react";
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import { EthersContext } from '../EthersProvider/EthersProvider';
import SuccessModal from "../Success/SuccessModal";
import ErrorModal from "../ErrorModal/Errormodal";
import { TOTAL_SBPS, INF, _0, INF_CHAR } from '../../Utils/Consts';
import { getNonce, getSendTx } from '../../Utils/SendTx';
import { hoodEncodeABI } from "../../Utils/HoodAbi";
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
  const [wasError, setWasError] = useState(false);
  const [waitConfirmation, setWaitConfirmation] = useState(false);
  const [sentState, setSentState] = useState(false);
  const [disabled, setDisabled] = useState(false);


  const [input, setInput] = useState('');
  const [balanceDASSET, setBalanceDASSET] = useState(null);
  const [approvalDASSET, setAllowanceDASSET] = useState(null);
  const [maxClicked, setMaxClicked] = useState(false);

  const [, , updateBasicInfo] = useContext(EthersContext);

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

  const TxCallback0 = async () => {
    setSentState(true);
  }

  const TxCallback1 = async () => {
    setSentState(false);
    setDisabled(false);
    updateBasicInfo();
  }

  const SendTx = getSendTx(TxCallback0, TxCallback1);

  const handleClickRepay = async () => {
    try {
      if (balanceDASSET != null && approvalDASSET != null && balanceDASSET.gte(absInputAmt)) {
        if (maxClicked) {
          setWaitConfirmation(true);
          setDisabled(true);
          await SendTx(userAddress, CMM, 'repayCVault', [vault.index, vault.borrowSharesOwed.toString(), false]);
          setWasError(false);
          setWaitConfirmation(false);
        }
        else {
          setWaitConfirmation(true);
          setDisabled(true);
          await SendTx(userAddress, CMM, 'repayCVault', [vault.index, absInputAmt.toString(), true]);
          setWasError(false);
          setWaitConfirmation(false);
        }
        setSuccess(SUCCESS_STATUS.REPAY_SUCCESS);
        setWasError(false);
        setWaitConfirmation(false);
      }
    } catch (err) {
      setSuccess(SUCCESS_STATUS.ERROR);
      setDisabled(false);
      setWasError(true);
      setWaitConfirmation(false);
    }
  }

  const handleClickApprove = async () => {
    try {
      if (balanceDASSET != null && approvalDASSET != null) {
        setWaitConfirmation(true);
        setDisabled(true);
        await SendTx(userAddress, DAI, 'approve', [CMM.address, INF.toString()]);
        setSuccess(SUCCESS_STATUS.APPROVAL_SUCCESS);
        setMaxClicked(false);
        setInput('');
        setWasError(false);
        setWaitConfirmation(false);
      }
    } catch (err) {
      setSuccess(SUCCESS_STATUS.ERROR);
      setDisabled(false);
      setWasError(true);
      setWaitConfirmation(false);
    }
  }

  const handleClosesuccess = () => {
    if (success === SUCCESS_STATUS.APPROVAL_SUCCESS) {
      setAllowanceDASSET(null);
      setSuccess(SUCCESS_STATUS.BASE);
    }
    else {
      handleClose();
    }
  }

  const handleErrorClose = () => {
    setSuccess(SUCCESS_STATUS.BASE);
    // force reload
    setAllowanceDASSET(null);
    setInput('');
    handleClose();
  }

  const sufficientApproval = balanceDASSET == null || approvalDASSET == null || (approvalDASSET.gte(absInputAmt) && !approvalDASSET.eq(_0));

  const buttonMessage = sufficientApproval ? "Repay DAI" : "Approve DAI";
  const onClick = sufficientApproval ? handleClickRepay : handleClickApprove;
  const txMessage = sufficientApproval ? "Repaying Debt" : "Approving DAI";
  const LoadingContents = sentState ? txMessage : 'Waiting For Confirmation';

  const BaseContents = (
    success === SUCCESS_STATUS.BASE &&
    <div className="deposite-withdraw">
      <div>
        <Modal.Header closeButton className={sentState || waitConfirmation ? "deposit-header": ""}>
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
          {Number(balanceDAIString) < Number(input) ?
              <button
                className="btn btn-deactive"
              >
              Insufficient Balance For Transaction
              </button>
            :
              <>
              {input === '' || Number(input) === 0 ?
                <>
                {wasError &&
                  <p className="text-center error-text" style={{ color: '#ef767a'}}>Something went wrong. Try again later.</p>
                }
                  <button
                    className={wasError ? "btn btn-deactive mt-0":"btn btn-deactive"}
                  >
                  Enter an amount
                  </button>
                </>
              :
                <>
                {waitConfirmation ?
                  <button
                  className="btn btn-deactive"
                  >
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span className="ms-3">{LoadingContents}</span>
                  </button>
                :
                  <button className="btn btn-deactive btn-active " onClick={onClick}>{buttonMessage}</button>
                }
                </>
              }
              </>
            }
          </div>
        </Modal.Body>
      </div>
    </div>
  );

  const successmodal = (
    <Modal
        show={success !== SUCCESS_STATUS.BASE && success !== SUCCESS_STATUS.ERROR}
        onHide={handleClosesuccess}
        centered
        animation={false}
        className="deposit-modal"
    >
        <SuccessModal handleClosesuccess={handleClosesuccess} />
    </Modal>
  );

  const errorModal = (
    <Modal
      show={success === SUCCESS_STATUS.ERROR}
      onHide={handleErrorClose}
      centered
      animation={false}
      className="deposit-modal"
    >
      <ErrorModal handleErrorClose={handleErrorClose}/>
    </Modal>
);

  return (
    <>
      {BaseContents}
      {successmodal}
      {errorModal}
    </>
  );
};

export default Debt;

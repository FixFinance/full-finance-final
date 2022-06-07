import React, {useState, useEffect} from "react";
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import SuccessModal from "../Success/SuccessModal";
import ErrorModal from "../ErrorModal/Errormodal";
import { TOTAL_SBPS, INF, _0 } from '../../Utils/Consts';
import { getNonce } from '../../Utils/SendTx';
import { hoodEncodeABI } from "../../Utils/HoodAbi";
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';
import './add-withdraw.scss';


const AddCollateral = ({
  handleClose,
  userAddress,
  CMM,
  CASSET,
  vault,
  forceUpdateVault
}) => {
  const SUCCESS_STATUS = {
    BASE: 0,
    APPROVAL_SUCCESS: 1,
    ADD_SUCCESS: 2,
    ERROR: 3
  }
  const [success, setSuccess] = useState(SUCCESS_STATUS.BASE);
  const [wasError, setWasError] = useState(false);
  const [waitConfirmation, setWaitConfirmation] = useState(false);
  const [sentState, setSentState] = useState(false);
  const [disabled, setDisabled] = useState(false);


  const [input, setInput] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);
  const [collApproval, setCollApproval] = useState(null);

  useEffect(() => {
    if (walletBalance == null) {
      CASSET.balanceOf(userAddress).then(res => setWalletBalance(res));
    }
    if (collApproval == null) {
      CASSET.allowance(userAddress, CMM.address).then(res => setCollApproval(res));
    }
  }, [walletBalance, collApproval]);

  const absInputAmt = BN.from(getAbsoluteString(input, parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS)));
  const impliedAmountSupplied = vault.amountSupplied.add(absInputAmt);
  const impliedCollateralizationRatio = vault.collateralizationRatio.mul(impliedAmountSupplied).div(vault.amountSupplied);

  const walletBalString = walletBalance == null ? '0' : getDecimalString(walletBalance.toString(), parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS), 5);
  const currentCollRatioString = vault.collateralizationRatio == null ? '0' : getDecimalString(vault.collateralizationRatio.toString(), 16, 2);
  const impliedCollRatioString = getDecimalString(impliedCollateralizationRatio.toString(), 16, 2);

  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value);
    setInput(filteredValue);
  }

  const handleClickMax = () => {
    setInput(walletBalString);
  }

  async function BroadcastTx(signer, tx) {
    console.log('Tx Initiated');
    let rec = await signer.sendTransaction(tx);
    console.log('Tx Sent', rec);
    setSentState(true);
    let resolvedRec = await rec.wait();
    console.log('Tx Resolved, resolvedRec');
    setSentState(false);
    setDisabled(false);
    return { rec, resolvedRec };
  }

  async function SendTx(userAddress, contractInstance, functionName, argArray, updateSentState, overrides={}) {
    if (contractInstance == null) {
      throw "SendTx2 Attempted to Accept Null Contract";
    }
  
    const signer = contractInstance.signer;
  
    let tx = {
      to: contractInstance.address,
      from: userAddress,
      data: hoodEncodeABI(contractInstance, functionName, argArray),
      nonce: await getNonce(signer.provider, userAddress),
      gasLimit: (await contractInstance.estimateGas[functionName](...argArray)).toNumber() * 2,
      ...overrides
    }
  
    let { resolvedRec } = await BroadcastTx(signer, tx, updateSentState);
  
    return resolvedRec;
  
  }

  const approveCollateral = async () => {
    try {
      if (collApproval != null) {
        setWaitConfirmation(true);
        setDisabled(true);
        await SendTx(userAddress, CASSET, 'approve', [CMM.address, INF.toString()]);
        setCollApproval(null);
        setSuccess(SUCCESS_STATUS.APPROVAL_SUCCESS);
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

  const addCollateral = async () => {
    try {
      if (collApproval != null && walletBalance != null && !absInputAmt.eq(_0) && absInputAmt.lte(walletBalance)) {
        setWaitConfirmation(true);
        setDisabled(true);
        await SendTx(userAddress, CMM, 'supplyToCVault', [vault.index, absInputAmt.toString()]);
        setSuccess(SUCCESS_STATUS.ADD_SUCCESS);
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
      if (success == SUCCESS_STATUS.APPROVAL_SUCCESS) {
          setCollApproval(null);
          setSuccess(SUCCESS_STATUS.BASE);
      }
      else {
          handleClose();
      }
  }

  const handleErrorClose = () => {
    setSuccess(SUCCESS_STATUS.BASE);
    // force reload
    setCollApproval(null);
    setInput('');
    handleClose();
  }

  const sufficientApproval = collApproval == null ? true : collApproval.gte(absInputAmt);

  const buttonMessage = sufficientApproval ? "Add WETH" : "Approve WETH";
  const handleActionClick = sufficientApproval ? addCollateral : approveCollateral;
  const txMessage = sufficientApproval ? "Adding Collateral" : "Approving Collateral";
  const LoadingContents = sentState ? txMessage : 'Waiting For Confirmation';


  const BaseContents = (
    success === SUCCESS_STATUS.BASE &&
    <div className="deposite-withdraw">
      <div>
        <Modal.Header closeButton className={sentState || waitConfirmation ? "deposit-header": ""}>
          <h5>Add Collateral</h5>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center middle_part mt-3">
            <p style={{ color: "#EDF0EB" }}>Collateral Amount WETH</p>
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
                    disabled={disabled}
                  />
                  <div
                    className="highlight"
                    onClick={handleClickMax}
                  >
                    max
                  </div>
                </div>
            </div>
            <div className="d-flex justify-content-between text-part">
              <p style={{ color: "#7D8282" }}>Wallet balance</p>
              <p style={{ color: "#7D8282" }}>{walletBalString} wETH</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={{ color: "#7D8282" }}>Implied Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{impliedCollRatioString}%</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={{ color: "#7D8282" }}>Current Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{currentCollRatioString}%</p>
            </div>
            <div className="d-flex justify-content-between text-part mt-2">
              <p style={{ color: "#7D8282" }}>Minimum Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{process.env.REACT_APP_COLLATERALIZATION_FACTOR}%</p>
            </div>
          </div>

          <div className="text-center mb-4">
          {Number(walletBalString) < Number(input) ?
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
                  <button className="btn btn-deactive btn-active " onClick={handleActionClick}>{buttonMessage}</button>
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

  const successModal = (
      <Modal
          show={success === SUCCESS_STATUS.APPROVAL_SUCCESS || success === SUCCESS_STATUS.ADD_SUCCESS}
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
      {successModal}
      {errorModal}
    </>
  );
};

export default AddCollateral;

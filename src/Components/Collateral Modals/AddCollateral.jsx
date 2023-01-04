import React, { useState, useContext, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { ethers, BigNumber as BN } from 'ethers';
import { EthersContext } from '../EthersProvider/EthersProvider';
import SuccessModal from "../Success/SuccessModal";
import ErrorModal from "../ErrorModal/Errormodal";
import { getNonce, getSendTx } from '../../Utils/SendTx';
import { TOTAL_SBPS, INF, _0 } from '../../Utils/Consts';
import { ENV_TICKERS, ENV_ESCROWS, ENV_ASSETS, ENV_MMM_ADDRESS } from '../../Utils/Env';
import { hoodEncodeABI } from "../../Utils/HoodAbi";
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';
import { getAssetInfApprovalAmount, getAssetBalanceString, getImplCollatRatioStrings } from '../../Utils/EthersStateProcessing';
import './add-withdraw.scss';

const IERC20ABI = require('../../abi/IERC20.json');
const IMetaMoneyMarketABI = require('../../abi/IMetaMoneyMarket.json');

let COLLATERAL_ADDRESSES = [];
let COLLATERAL_SYMBOLS = [];
let COLLATERAL_ESCROW_ADDRESSES = [];

const SUCCESS_STATUS = {
  BASE: 0,
  APPROVAL_SUCCESS: 1,
  ADD_SUCCESS: 2,
  ERROR: 3
}


const AddCollateral = ({
  handleClose,
  userAddress,
  signer,
  envIndex,
  basicInfo
}) => {

  console.log("RENDER ADD COLLATERAL ", envIndex);

  const [success, setSuccess] = useState(SUCCESS_STATUS.BASE);
  const [wasError, setWasError] = useState(false);
  const [waitConfirmation, setWaitConfirmation] = useState(false);
  const [sentState, setSentState] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const [input, setInput] = useState('');

  const [, , updateBasicInfo] = useContext(EthersContext);

  const {
    assetBals,
    assetAllowances,
    aggInfo,
    irmInfo,
    vault,
    vaultDetails
  } = basicInfo;

  const walletBalance = assetBals === null ? null : assetBals[envIndex];
  const collApproval = assetAllowances === null ? null : assetAllowances[envIndex];

  const TICKER = ENV_TICKERS[envIndex];

  const absInputAmt = BN.from(getAbsoluteString(input, parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS)));

  const walletBalString = getAssetBalanceString(assetBals, envIndex);
  const currentCollRatioString = vaultDetails === null ? '0' : vaultDetails.effCollateralizationRatioString;
  const {
    implEffCollatRatioString,
    implReqCollatRatioString
  } = getImplCollatRatioStrings(vaultDetails, aggInfo, false, absInputAmt, envIndex);

  let CASSET = signer == null ? null : new ethers.Contract(ENV_ASSETS[envIndex], IERC20ABI, signer);
  let MMM = signer == null ? null : new ethers.Contract(ENV_MMM_ADDRESS, IMetaMoneyMarketABI, signer);

  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value);
    setInput(filteredValue);
  }

  const handleClickMax = () => {
    setInput(walletBalString);
  }

  const TxCallback0 = async () => {    
    setSentState(true);
  }

  const TxCallback1 = async () => {
    setSentState(false);
    setDisabled(false);
    updateBasicInfo({vault: true, assetBals: true, assetAllowances: true});
  }

  const SendTx = getSendTx(TxCallback0, TxCallback1);

  const approveCollateral = async () => {
    try {
      if (collApproval != null) {
        setWaitConfirmation(true);
        setDisabled(true);
        await SendTx(userAddress, CASSET, 'approve', [ENV_ESCROWS[envIndex], getAssetInfApprovalAmount(envIndex).toString()]);
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
        await SendTx(userAddress, MMM, 'supplyToCVault', [envIndex, absInputAmt.toString()]);
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
          setSuccess(SUCCESS_STATUS.BASE);
      }
      else {
          handleClose();
      }
  }

  const handleErrorClose = () => {
    setSuccess(SUCCESS_STATUS.BASE);
    // force reload
    setInput('');
    handleClose();
  }

  const sufficientApproval = collApproval == null ? true : collApproval.gte(absInputAmt);

  const buttonMessage = (sufficientApproval ? "Add " : "Approve ")+TICKER;
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
            <p style={{ color: "#EDF0EB" }}>Collateral Amount {TICKER}</p>
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
              <p style={{ color: "#7D8282" }}>{walletBalString} {TICKER}</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={{ color: "#7D8282" }}>Implied Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{implEffCollatRatioString}%</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={{ color: "#7D8282" }}>Current Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{currentCollRatioString}%</p>
            </div>
            <div className="d-flex justify-content-between text-part mt-2">
              <p style={{ color: "#7D8282" }}>Minimum Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{implReqCollatRatioString}%</p>
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

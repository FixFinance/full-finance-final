import React, { useState, useContext } from "react";
import Modal from "react-bootstrap/Modal";
import { ethers, BigNumber as BN } from 'ethers';
import { hoodEncodeABI } from "../../Utils/HoodAbi";
import "./depositmodal.scss";
import SuccessModal from "../Success/SuccessModal";
import ErrorModal from "../ErrorModal/Errormodal";
import { EthersContext } from '../EthersProvider/EthersProvider';
import { LoginContext } from "../../helper/userContext";
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration.js';
import { getNonce, getSendTx } from '../../Utils/SendTx';
import { _0, INF } from '../../Utils/Consts';
import { ENV_ASSET_DECIMALS } from '../../Utils/Env';
import { getAssetBalanceString, getFLTUnderlyingValue, getFLTUnderlyingValueString } from '../../Utils/EthersStateProcessing';
import { ControlledInput } from '../ControlledInput/ControlledInput';

const IERC20ABI = require('../../abi/IERC20.json');
const IMetaMoneyMarketABI = require('../../abi/IMetaMoneyMarket.json');

const ENV_TICKERS = JSON.parse(process.env.REACT_APP_TICKERS);
const ENV_ASSETS = JSON.parse(process.env.REACT_APP_LISTED_ASSETS);
const ENV_ESCROWS = JSON.parse(process.env.REACT_APP_ESCROWS);

const getPureInput = (input, ticker) => input.substring(0, input.length-1-ticker.length);

const DepositPopup = ({ handleClose, basicInfo, assetEnvIndex }) => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [wasError, setWasError] = useState(false);
  const [waitConfirmation, setWaitConfirmation] = useState(false);
  const [sentState, setSentState] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const [input, setInput] = useState('');

  const [getWalletInfo, , updateBasicInfo] = useContext(EthersContext);

  const assetBalance = basicInfo.assetBals === null ? null : basicInfo.assetBals[assetEnvIndex];
  const assetApproval = basicInfo.assetAllowances === null ? null : basicInfo.assetAllowances[assetEnvIndex];
  const balanceLendShares = basicInfo.fltBals === null ? null : basicInfo.fltBals[assetEnvIndex];
  const lendShareValue = getFLTUnderlyingValue(basicInfo.fltBals, basicInfo.irmInfo, assetEnvIndex);

  const balanceString = getAssetBalanceString(basicInfo.assetBals, assetEnvIndex);
  const lsValueString = getFLTUnderlyingValueString(basicInfo.fltBals, basicInfo.irmInfo, assetEnvIndex);

  const TICKER = ENV_TICKERS[assetEnvIndex];

  const absoluteInput = BN.from(getAbsoluteString('0'+getPureInput(input, TICKER), ENV_ASSET_DECIMALS[assetEnvIndex]));

  const [provider, userAddress] = getWalletInfo();
  const signer = provider == null ? null : provider.getSigner();


  const updateRelevantInfo = () => {
    updateBasicInfo({assetBals: true, assetAllowances: true, fltBals: true, irmInfo: true});
  };

  const handleClosesuccess = () => {
    setSuccess(false);
    setInput('');
  }
  const handleErrorClose = () => {
    setError(false);
    // force reload everything
    updateRelevantInfo();
    setInput('');
  }

  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value)+' '+TICKER;
    setInput(filteredValue);
  }
  const handleClickMax = () => {
    setInput(balanceString+' '+TICKER);
  }

  let ASSET = signer == null ? null : new ethers.Contract(ENV_ASSETS[assetEnvIndex], IERC20ABI, signer);
  let MMM = signer == null ? null : new ethers.Contract(process.env.REACT_APP_MMM_ADDRESS, IMetaMoneyMarketABI, signer);

  const TxCallback0 = async () => {
    setSentState(true);
  }

  const TxCallback1 = async () => {
    setSentState(false);
    setDisabled(false);
    updateRelevantInfo();
  }

  const SendTx = getSendTx(TxCallback0, TxCallback1);

  const depositOnClick = async () => {
    try {
      if (assetBalance === null || assetApproval === null || balanceLendShares === null) {
        return;
      }
      if (absoluteInput.gt(assetApproval) || assetApproval.eq(BN.from(0))) {
        setWaitConfirmation(true);
        setDisabled(true);
        await SendTx(userAddress, ASSET, 'approve', [ENV_ESCROWS[assetEnvIndex], INF.toString()]);
      }
      else {
        setWaitConfirmation(true);
        setDisabled(true);
        await SendTx(userAddress, MMM, 'lend', [ENV_ASSETS[assetEnvIndex], absoluteInput.toString(), true]);
      }
      setSuccess(true);
      setWasError(false);
      setWaitConfirmation(false);
    } catch (err) {
      setError(true);
      setDisabled(false);
      setWasError(true);
      setWaitConfirmation(false);
    }
  };

  /// Working on Component to avoid recursion ///

    // const depositOnClick = async () => {
  //   // try {
  //     if (DAIbalance === null || DAIapproval === null || balanceLendShares === null) {
  //       return;
  //     }
  //     if (absoluteInput.gt(DAIapproval) || DAIapproval.eq(BN.from(0))) {
  //       setFunctionMessage('Approving');
  //       setContractInstance(DAI);
  //       setFunctionName('approve');
  //       setArgArray([CMM.address, INF.toString()]);
  //     }
  //     else {
  //       setFunctionMessage('Depositing');
  //       setContractInstance(CMM);
  //       setFunctionName('depositSpecificUnderlying');
  //       setArgArray([userAddress, absoluteInput.toString()]);
  //     }
  //     setSuccess(true);
  //     setWaitConfirmation(false);
  //   // } catch (err) {
  //   //   setError(true);
  //   //   setWaitConfirmation(false);
  //   // }
  // };


  const handleDeposit = async () => {};
  const handleApprove = async () => {};

  const ButtonContents = (![assetBalance, assetApproval].includes(null) && assetApproval.lt(absoluteInput) ? 'Approve ' : 'Deposit ')+TICKER;
  const txMessage = (![assetBalance, assetApproval].includes(null) && assetApproval.lt(absoluteInput) ? "Approving " : "Depositing ")+TICKER;
	const LoadingContents = sentState ? txMessage : 'Waiting For Confirmation';

  const placeholder = ' '.repeat(14-TICKER.length)+'0.00 '+TICKER+' ';

  return (
    <div className="deposite-withdraw">
      {success || error ? null : (
        <div>
          <Modal.Header closeButton className={sentState || waitConfirmation ? "deposit-header" : ""}>
            <h5>Deposit {TICKER}</h5>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center middle_part mt-3">
              <p style={{ color: "#EDF0EB" }}>Amount to deposit</p>
              <div className="form-group mt-3">

                <div className="relative">
                <ControlledInput
                    type="text"
                    className="  form-field"
                    id="exampleInput1"
                    aria-describedby="textHelp"
                    onChange={handleInput}
                    placeholder={placeholder}
                    value={input}
                    disabled={disabled}
                  />
                  <div className="highlight" onClick={handleClickMax}>max</div>
                </div>


              </div>
              <div className="d-flex justify-content-between text-part">
                <p style={{ color: "#7D8282" }}>Wallet Balance</p>
                <p style={{ color: "#7D8282" }}>{balanceString} {TICKER}</p>
              </div>

              <div className="d-flex justify-content-between text-part">
                <p style={{ color: "#7D8282" }}>Deposit Balance</p>
                <p style={{ color: "#7D8282" }}>{lsValueString} {TICKER}</p>
              </div>

            </div>
            <div className="text-center mb-4">
            {Number(balanceString) < getPureInput(input, TICKER) ?
              <button
                className="btn btn-deactive"
              >
              Insufficient Balance For Transaction
              </button>
            :
              <>
              {input === '' || Number(getPureInput(input, TICKER)) === 0 ?
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
                  <button
                    className="btn btn-deactive btn-active "
                    onClick={depositOnClick}
                  >
                    {" "}
                    {ButtonContents}
                  </button>
                }
                </>
              }
              </>
            }
            </div>
          </Modal.Body>
        </div>
      )}

      <Modal
        show={success}
        onHide={handleClosesuccess}
        centered
        animation={false}
        className="deposit-modal"
      >
        <SuccessModal handleClosesuccess={handleClosesuccess} />
      </Modal>

      <Modal
        show={error}
        onHide={handleErrorClose}
        centered
        animation={false}
        className="deposit-modal"
      >
        <ErrorModal handleErrorClose={handleErrorClose}/>
      </Modal>
    </div>
  );
};

export default DepositPopup;

import React, { useState, useContext} from "react";
import Modal from "react-bootstrap/Modal";
import { ethers, BigNumber as BN } from 'ethers';
import { hoodEncodeABI } from "../../Utils/HoodAbi";
import "./depositmodal.scss";
import SuccessModal from "../Success/SuccessModal";
import { EthersContext } from '../EthersProvider/EthersProvider';
import { LoginContext } from "../../helper/userContext";
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration.js';
import { getSendTx } from '../../Utils/SendTx';
import { getFLTBalanceString, getFLTUnderlyingValue, getFLTUnderlyingValueString } from '../../Utils/EthersStateProcessing';
import { ControlledInput } from '../ControlledInput/ControlledInput';
import ErrorModal from "../ErrorModal/Errormodal";


const IERC20ABI = require('../../abi/IERC20.json');
const IMetaMoneyMarketABI = require('../../abi/IMetaMoneyMarket.json');

const ENV_TICKERS = JSON.parse(process.env.REACT_APP_TICKERS);
const ENV_ASSETS = JSON.parse(process.env.REACT_APP_LISTED_ASSETS);

const getPureInput = (input) => input.substring(0, input.length-4);

const WithdrawModal=({ handleClose2, basicInfo, assetEnvIndex })=> {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [wasError, setWasError] = useState(false);
  const [input, setInput] = useState('');
  const [sentState, setSentState] = useState(false);
  const [waitConfirmation, setWaitConfirmation] = useState(false);
  const [disabled, setDisabled] = useState(false);


  const [getWalletInfo, , updateBasicInfo] = useContext(EthersContext);
  const [provider, userAddress] = getWalletInfo();
  const signer = provider == null ? null : provider.getSigner();

  const lendShareBalanceString = getFLTBalanceString(basicInfo.fltBals, assetEnvIndex);
  const lendShareValueString = getFLTUnderlyingValueString(basicInfo.fltBals, basicInfo.irmInfo, assetEnvIndex);
  const absoluteInput = BN.from(getAbsoluteString('0'+getPureInput(input), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS)));

  const TICKER = ENV_TICKERS[assetEnvIndex];

  const updateRelevantInfo = () => {
    updateBasicInfo({assetBals: true, fltBals: true, irmInfo: true});
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
  const handleShow = () => setSuccess(true);
  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value)+' FLT';
    setInput(filteredValue);
  }
  const handleClickMax = () => {
    setInput(lendShareBalanceString+' FLT');
  }

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

  const withdrawOnClick = async () => {
    try {
      if ([basicInfo.fltBals, basicInfo.irmInfo].includes(null)) {
        return;
      }
      setWaitConfirmation(true);
      setDisabled(true);
      await SendTx(userAddress, MMM, 'withdraw', [userAddress, ENV_ASSETS[assetEnvIndex], absoluteInput.toString(), false]);
      setWaitConfirmation(false);
      setSuccess(true);
      setWasError(false);
    } catch (err) {
      console.error(err);
      setError(true);
      setDisabled(false);
      setWasError(true);
      setWaitConfirmation(false);
    }
  }

  const LoadingContents = sentState ? "Withdrawing" : 'Waiting For Confirmation';

  const Button = (
    <>
      {Number(lendShareBalanceString) < getPureInput(input) ?
          <button
            className="btn btn-deactive"
          >
          Insufficient Balance For Transaction
          </button>
        :
          <>
          {input === '' || Number(getPureInput(input)) === 0 ?
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
              onClick={withdrawOnClick}
            >
              {" "}
              Withdraw {TICKER}
            </button>
            }
            </>
          }
          </>
      }
    </>
  );

  return (
    <div>
        <div className="deposite-withdraw">
    {success || error ? null : (
      <div>
        <Modal.Header closeButton className={sentState || waitConfirmation ? "deposit-header": ""}>
          <h5>Redeem FLT for {TICKER}</h5>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center middle_part mt-3">
            <p style={{ color: "#EDF0EB" }}>Amount</p>
            <div className="form-group mt-3">
            <div className="relative">
                <ControlledInput
                    type="text"
                    className="  form-field"
                    id="exampleInput1"
                    aria-describedby="textHelp"
                    onChange={handleInput}
                    placeholder="           0.00 FLT"
                    value={input}
                    disabled={disabled}
                  />
                  <div className="highlight" onClick={handleClickMax}>max</div>
                </div>
            </div>
            <div className="d-flex justify-content-between text-part">
              <p style={{ color: "#7D8282" }}>FLT Balance</p>
              <p style={{ color: "#7D8282" }}>{lendShareBalanceString} FLT</p>
            </div>

            <div className="d-flex justify-content-between text-part">
              <p style={{ color: "#7D8282" }}>FLT Value</p>
              <p style={{ color: "#7D8282" }}>{lendShareValueString} {TICKER}</p>
            </div>
          </div>
          <div className="text-center mb-4">
            {Button}
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
  </div></div>
  )
}

export default WithdrawModal;
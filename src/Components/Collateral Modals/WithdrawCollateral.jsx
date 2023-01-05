import React, { useState, useContext, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { ethers, BigNumber as BN } from 'ethers';
import { EthersContext } from '../EthersProvider/EthersProvider';
import SuccessModal from "../Success/SuccessModal";
import ErrorModal from "../ErrorModal/Errormodal";
import { neg } from '../../Utils/BNtools';
import { TOTAL_SBPS, INF, _0, GOOD_COLLAT_RATIO_MULTIPLIER } from '../../Utils/Consts';
import { getNonce, getSendTx } from '../../Utils/SendTx';
import { ENV_MMM_ADDRESS, ENV_TICKERS, ENV_ASSETS, ENV_ASSET_DECIMALS } from '../../Utils/Env';
import { hoodEncodeABI } from "../../Utils/HoodAbi";
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';
import { getImplCollatRatioStrings, isGoodCollatRatio } from '../../Utils/EthersStateProcessing';
import './add-withdraw.scss';

const IMetaMoneyMarketABI = require('../../abi/IMetaMoneyMarket.json');

const toTrimmedString = x => {
  let str = x.toString();
  let halves = str.split('.');
  if (halves.length < 2) {
    return str;
  }
  else {
    return halves[0] + '.' + halves[1].substring(0, 2);
  }
};

const WithdrawCollateral = ({
  handleClose,
  userAddress,
  signer,
  envIndex,
  basicInfo
}) => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [input, setInput] = useState('');
  const [wasError, setWasError] = useState(false);
  const [waitConfirmation, setWaitConfirmation] = useState(false);
  const [sentState, setSentState] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const [, , updateBasicInfo] = useContext(EthersContext);

  const {
    assetBals,
    assetAllowances,
    aggInfo,
    irmInfo,
    vault,
    vaultDetails
  } = basicInfo;


  const asset = ENV_ASSETS[envIndex];
  const TICKER = ENV_TICKERS[envIndex];

  const amountSupplied = vaultDetails === null ? null : vaultDetails[asset].suppliedUnderlying;
  const absInputAmt = BN.from(getAbsoluteString(input, ENV_ASSET_DECIMALS[envIndex]));
  const impliedAmountSupplied = amountSupplied === null ? null : amountSupplied.sub(absInputAmt);

  const {
    implEffCollatRatioString,
    implReqCollatRatioString
  } = getImplCollatRatioStrings(vaultDetails, aggInfo, false, neg(absInputAmt), envIndex);


  const amtSuppliedStringAbbreviated = amountSupplied === null ? '0' : getDecimalString(amountSupplied.toString(), ENV_ASSET_DECIMALS[envIndex], 5);
  const currentCollRatioString = vaultDetails === null ? '0' : vaultDetails.effCollateralizationRatioString;
  const resultantCollatRatioSafe = isGoodCollatRatio(implEffCollatRatioString, implReqCollatRatioString);

  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value);
    setInput(filteredValue);
  }

  const TxCallback0 = async () => {
    setSentState(true);
  }

  const TxCallback1 = async () => {
    setSentState(false);
    setDisabled(false);
    updateBasicInfo({vault: true, assetBals: true, irmInfo: true});
  }

  const SendTx = getSendTx(TxCallback0, TxCallback1);

  const handleClickWithdraw = async () => {
    try {
      if (absInputAmt.gt(_0) && resultantCollatRatioSafe) {
        setWaitConfirmation(true);
        setDisabled(true);
        let MMM = new ethers.Contract(ENV_MMM_ADDRESS, IMetaMoneyMarketABI, signer);
        const collatAssetIndex = vault.collateralAssets.indexOf(asset);
        await SendTx(userAddress, MMM, 'withdrawCollateral', [userAddress, collatAssetIndex, absInputAmt.toString(), true]);
        setSuccess(true);
        setWasError(false);
        setWaitConfirmation(false);
      }
    } catch (err) {
      setSuccess(false);
      setDisabled(false);
      setWasError(true);
      setError(true)
      setWaitConfirmation(false);
    }
  }

  const handleErrorClose = () => {
    setSuccess(false);
    // force reload
    setInput('');
    setError(false);
    handleClose();
  }

  const LoadingContents = sentState ? "Withdrawing Collateral" : 'Waiting For Confirmation';

  const BaseContents = (
    !success && error === false &&
    <div className="deposite-withdraw">
      <div>
        <Modal.Header closeButton className={sentState || waitConfirmation ? "deposit-header": ""}>
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
                    disabled={disabled}
                  />
                </div>
            </div>
            <div className="d-flex justify-content-between text-part">
              <p style={{ color: "#7D8282" }}>Current Collateral</p>
              <p style={{ color: "#7D8282" }}>{amtSuppliedStringAbbreviated} {TICKER}</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>Implied Coll. Ratio</p>
              <p style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>{implEffCollatRatioString}%</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>Current Coll. Ratio</p>
              <p style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>{currentCollRatioString}%</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={{ color: "#7D8282" }}>Min. Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{toTrimmedString(implReqCollatRatioString * GOOD_COLLAT_RATIO_MULTIPLIER)}%</p>
            </div>
            <div className="d-flex justify-content-between text-part mt-2">
              <p style={{ color: "#7D8282" }}>Liquidation Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{implReqCollatRatioString}%</p>
            </div>
          </div>

          <div className="text-center mb-4">
          {Number(amtSuppliedStringAbbreviated) < Number(input) ?
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
                  <button className="btn btn-deactive btn-active " onClick={handleClickWithdraw}>
                    {" "}
                    Withdraw {TICKER}
                  </button>
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
        show={success}
        onHide={handleClose}
        centered
        animation={false}
        className="deposit-modal"
    >
        <SuccessModal handleClosesuccess={handleClose} />
    </Modal>
  );

  const errorModal = (
    <Modal
      show={error}
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

export default WithdrawCollateral;

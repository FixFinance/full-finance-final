import React, {useState, useContext, useEffect} from "react";
import Modal from "react-bootstrap/Modal";
import { ethers, BigNumber as BN } from 'ethers';
import { EthersContext } from '../EthersProvider/EthersProvider';
import SuccessModal from "../Success/SuccessModal";
import ErrorModal from "../ErrorModal/Errormodal";
import { ENV_MMM_ADDRESS, ENV_TICKERS, ENV_ASSETS, ENV_ASSET_DECIMALS } from '../../Utils/Env';
import { TOTAL_SBPS, INF, _0, GOOD_COLLAT_RATIO_MULTIPLIER } from '../../Utils/Consts';
import { getNonce, getSendTx } from '../../Utils/SendTx';
import { hoodEncodeABI } from "../../Utils/HoodAbi";
import { getAssetBalanceString, getImplCollatRatioStrings, isGoodCollatRatio } from '../../Utils/EthersStateProcessing';
import { toTrimmedString, filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';
import './collateral-ratio.scss';
import { BNmin, BNmax } from '../../Utils/BNtools';

const IMetaMoneyMarketABI = require('../../abi/IMetaMoneyMarket.json');

const BorrowMore=({
  handleClose,
  userAddress,
  signer,
  envIndex,
  basicInfo
})=> {

  const [success, setSuccess] = useState(false);
  const [input, setInput] = useState('');

  const [error, setError] = useState(false);
  const [wasError, setWasError] = useState(false);
  const [waitConfirmation, setWaitConfirmation] = useState(false);
  const [sentState, setSentState] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const [, , updateBasicInfo] = useContext(EthersContext);

  const {
    assetBals,
    aggInfo,
    irmInfo,
    vault,
    vaultDetails
  } = basicInfo;

  const asset = ENV_ASSETS[envIndex];
  const TICKER = ENV_TICKERS[envIndex];

  const absInputAmt = BN.from(getAbsoluteString(input, ENV_ASSET_DECIMALS[envIndex]));

  //Borrow-Lend Supply Difference
  const BLSdiff = irmInfo === null ? _0 : irmInfo[envIndex].supplyLent.sub(irmInfo[envIndex].supplyBorrowed);

  const startingBorrowObligation = (vaultDetails === null || vaultDetails[asset] === undefined ? _0 : vaultDetails[asset].borrowedUnderlying);
  const resultantBorrowObligation = startingBorrowObligation.add(absInputAmt);
  const {
    implEffCollatRatioString,
    implReqCollatRatioString
  } = getImplCollatRatioStrings(vaultDetails, aggInfo, true, absInputAmt, envIndex);

  const borrowObligationString = getDecimalString(startingBorrowObligation.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 3);
  const balanceDebtString = getAssetBalanceString(assetBals, envIndex, 5);

  const resultantCollatRatioSafe = isGoodCollatRatio(implEffCollatRatioString, implReqCollatRatioString);

  const TxCallback0 = async () => {
    setSentState(true);
  }

  const TxCallback1 = async () => {
    setSentState(false);
    setDisabled(false);
    updateBasicInfo({assetBals: true, vault: true, irmInfo: true});
  }

  const SendTx = getSendTx(TxCallback0, TxCallback1);

  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value);
    setInput(filteredValue);
  }

  const handleClickBorrow = async () => {
    try {
      if (resultantCollatRatioSafe && absInputAmt.lte(BLSdiff) && vault !== null) {
        setWaitConfirmation(true);
        setDisabled(true);
        const MMM = new ethers.Contract(ENV_MMM_ADDRESS, IMetaMoneyMarketABI, signer);
        console.log("asset to borrow", asset);
        console.log("vault", vault);
        if (vault.debtAssets.indexOf(asset) === -1) {
          let expectedIndex = 0;
          for (;expectedIndex<vault.debtAssets.length && BN.from(vault.debtAssets[expectedIndex]).lt(BN.from(asset)); expectedIndex++) {}
          await SendTx(userAddress, MMM, 'borrowNewDebt', [userAddress, expectedIndex, asset, absInputAmt.toString(), true]);
        }
        else {
          let index = vault.debtAssets.indexOf(asset);
          await SendTx(userAddress, MMM, 'borrowExistingDebt', [userAddress, index, absInputAmt.toString(), true])
        }
        setSuccess(true);
        setWaitConfirmation(false);
        setWasError(false);
      }
    } catch (err) {
      setSuccess(false);
      setDisabled(false);
      setError(true);
      setWasError(true);
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

  const LoadingContents = sentState ? "Borrowing "+TICKER : 'Waiting For Confirmation';

  const BaseContents = (
    !success && !error &&
    <div className="deposite-withdraw">
    <div>
      <Modal.Header closeButton className={sentState || waitConfirmation ? "deposit-header": ""}>
        <h5>Borrow More</h5>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center middle_part mt-3">
          <p style={{ color: "#EDF0EB" }}>Amount to Borrow</p>
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
            <p style={{ color: "#7D8282" }}>{TICKER} Balance</p>
            <p style={{ color: "#7D8282" }}>{balanceDebtString} {TICKER}</p>
          </div>
          <div className="d-flex justify-content-between text-part border_bottom">
            <p style={{ color: "#7D8282" }}>Debt amount</p>
            <div>
              <p style={{ color: "#7D8282" }}>{borrowObligationString} {TICKER}</p>
              {/* <p style={{ color: "#7D8282" }}>→ 500.00 {TICKER}</p> */}
            </div>
          </div>
          <div className={"d-flex justify-content-between text-part mt-2 border_bottom"} style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>
            <p>Current Coll. Ratio</p>
            <p>{vaultDetails === null ? '0' : vaultDetails.effCollateralizationRatioString}%</p>
          </div>
          <div className={"d-flex justify-content-between text-part mt-2 border_bottom"} style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>
            <p>Resultant Coll. Ratio</p>
            <p>{implEffCollatRatioString}%</p>
          </div>
          <div className="d-flex justify-content-between text-part mt-2 border_bottom">
            <p style={{ color: "#7D8282" }}>Liquidation Coll. Ratio</p>
            <p style={{ color: "#7D8282" }}>{implReqCollatRatioString}%</p>
          </div>
          <div className="d-flex justify-content-between text-part mt-2">
            <p style={{ color: "#7D8282" }}>Minimum Coll. Ratio</p>
            <p style={{ color: "#7D8282" }}>{toTrimmedString(implReqCollatRatioString * GOOD_COLLAT_RATIO_MULTIPLIER)}%</p>
          </div>
        </div>

        <div className="text-center mb-4">
        {Number(balanceDebtString) < Number(input) ?
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
                  <button className="btn btn-deactive btn-active " onClick={handleClickBorrow}> Borrow {TICKER}</button>
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

  return(
    <>
      {BaseContents}
      {successModal}
      {errorModal}
    </>
  );
}

export default BorrowMore;
import React, {useState, useContext, useEffect} from "react";
import Modal from "react-bootstrap/Modal";
import { ethers, BigNumber as BN } from 'ethers';
import { EthersContext } from '../EthersProvider/EthersProvider';
import SuccessModal from "../Success/SuccessModal";
import ErrorModal from "../ErrorModal/Errormodal";
import { ENV_MMM_ADDRESS, ENV_TICKERS, ENV_ASSETS, ENV_ASSET_DECIMALS, ENV_ESCROWS } from '../../Utils/Env';
import { TOTAL_SBPS, INF, _0, INF_CHAR } from '../../Utils/Consts';
import { getNonce, getSendTx } from '../../Utils/SendTx';
import { hoodEncodeABI } from "../../Utils/HoodAbi";
import { getAssetInfApprovalAmount, getAssetBalanceString, getImplCollatRatioStrings } from '../../Utils/EthersStateProcessing';
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';
import { neg } from '../../Utils/BNtools';

const IMetaMoneyMarketABI = require('../../abi/IMetaMoneyMarket.json');
const IERC20ABI = require('../../abi/IERC20.json');

const Debt = ({
  handleClose,
  userAddress,
  signer,
  envIndex,
  basicInfo
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
  const [maxClicked, setMaxClicked] = useState(false);

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

  const balanceDebtAsset = assetBals === null ? _0 : assetBals[envIndex];
  const approvalDebtAsset = assetAllowances === null ? _0 : assetAllowances[envIndex];
  const absInputAmt = BN.from(getAbsoluteString(input.toString(), ENV_ASSET_DECIMALS[envIndex]));
  const startingBorrowObligation = (vaultDetails === null || vaultDetails[asset] === undefined ? _0 : vaultDetails[asset].borrowedUnderlying);
  const resultantBorrowObligation = startingBorrowObligation.add(absInputAmt);
  const currEffCollatRatioString = vaultDetails === null ? '0' : vaultDetails.effCollateralizationRatioString;
  const {
    implEffCollatRatioString,
    implReqCollatRatioString
  } = getImplCollatRatioStrings(vaultDetails, aggInfo, true, neg(maxClicked ? startingBorrowObligation : absInputAmt), envIndex);

  const borrowObligationString = getDecimalString(startingBorrowObligation.toString(), ENV_ASSET_DECIMALS[envIndex], 5);
  const balanceDebtString = getAssetBalanceString(assetBals, envIndex, 5);

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
    updateBasicInfo({vault: true, irmInfo: true, assetAllowances: true, assetBals: true});
  }

  const SendTx = getSendTx(TxCallback0, TxCallback1);

  const handleClickRepay = async () => {
    try {
      if (![balanceDebtAsset, approvalDebtAsset].includes(null) && balanceDebtAsset.gte(absInputAmt)) {
        setWaitConfirmation(true);
        setDisabled(true);
        const MMM = new ethers.Contract(ENV_MMM_ADDRESS, IMetaMoneyMarketABI, signer);
        let debtIndex = vault === null ? -1 : vault.debtAssets.indexOf(asset);
        if (debtIndex === -1) {
          throw Error("Invalid index in vault.debtAssets of target repay asset");
        }
        if (maxClicked) {
          let {
            collateralAssets,
            collateralLendShareAmounts,
            debtAssets,
            debtShareAmounts
          } = vault;
          debtAssets = debtAssets.filter((x, i) => i !== debtIndex);
          debtShareAmounts = debtShareAmounts.filter((x, i) => i !== debtIndex).map(x => x.toString());
          collateralLendShareAmounts = collateralLendShareAmounts.map(x => x.toString());
          await SendTx(userAddress, MMM, 'manageConnectedVault', [userAddress, collateralAssets, collateralLendShareAmounts, debtAssets, debtShareAmounts]);
        }
        else {
          await SendTx(userAddress, MMM, 'repayDebt', [userAddress, debtIndex, absInputAmt.toString(), true]);
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
      if (![balanceDebtAsset, approvalDebtAsset].includes(null)) {
        setWaitConfirmation(true);
        setDisabled(true);
        const AssetContract = new ethers.Contract(asset, IERC20ABI, signer);
        const infApprovalAmount = getAssetInfApprovalAmount(envIndex).toString();
        await SendTx(userAddress, AssetContract, 'approve', [ENV_ESCROWS[envIndex], infApprovalAmount]);
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

  const sufficientApproval = [balanceDebtAsset, approvalDebtAsset].includes(null) || (approvalDebtAsset.gte(absInputAmt) && !approvalDebtAsset.eq(_0));

  const buttonMessage = (sufficientApproval ? "Repay " : "Approve ")+TICKER;
  const onClick = sufficientApproval ? handleClickRepay : handleClickApprove;
  const txMessage = sufficientApproval ? "Repaying Debt" : "Approving "+TICKER;
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
              <p style={{ color: "#7D8282" }}>{borrowObligationString} {TICKER}</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={{ color: "#7D8282" }}>Balance {TICKER}</p>
              <div>
                <p style={{ color: "#7D8282" }}>{balanceDebtString} {TICKER}</p>
              </div>
            </div>
            <div className="d-flex justify-content-between text-part mt-2 border_bottom">
              <p style={{ color: "#7D8282" }}>Resultant Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{implEffCollatRatioString}%</p>
            </div>

            <div className="d-flex justify-content-between text-part mt-2 border_bottom">
              <p style={{ color: "#7D8282" }}>Current Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{currEffCollatRatioString}%</p>
            </div>

            <div className="d-flex justify-content-between text-part mt-2">
              <p style={{ color: "#7D8282" }}>Liquidation Coll. Ratio</p>
              <p style={{ color: "#7D8282" }}>{implReqCollatRatioString}%</p>
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

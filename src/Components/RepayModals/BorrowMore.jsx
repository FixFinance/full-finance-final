import React, {useState, useEffect} from "react";
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import SuccessModal from "../Success/SuccessModal";
import ErrorModal from "../ErrorModal/Errormodal";
import { TOTAL_SBPS, INF, _0 } from '../../Utils/Consts';
import { getNonce } from '../../Utils/SendTx';
import { hoodEncodeABI } from "../../Utils/HoodAbi";
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';
import './collateral-ratio.scss';
import { BNmin, BNmax } from '../../Utils/BNtools';

const BorrowMore=({
  handleClose,
  userAddress,
  CMM,
  DAI,
  vault,
  forceUpdateVault,
  supplyBorrowedBN,
  supplyLentBN
})=> {

  const [success, setSuccess] = useState(false);
  const [input, setInput] = useState('');
  const [balanceDASSET, setBalanceDASSET] = useState(null);

  const [error, setError] = useState(false);
  const [wasError, setWasError] = useState(false);
  const [waitConfirmation, setWaitConfirmation] = useState(false);
  const [sentState, setSentState] = useState(false);

  useEffect(() => {
    if (balanceDASSET == null) {
      DAI.balanceOf(userAddress).then(res => setBalanceDASSET(res));
    }
  }, [balanceDASSET]);

  const absInputAmt = BN.from(getAbsoluteString(input, parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS)));

  //Borrow-Lend Supply Difference
  const BLSdiff = supplyBorrowedBN != null && supplyLentBN != null ? supplyLentBN.sub(supplyBorrowedBN) : _0;

  const minCollatRatioBN = BN.from(parseInt(process.env.REACT_APP_COLLATERALIZATION_FACTOR)+5).mul(BN.from(10).pow(BN.from(16)));
  const maxBorrowObligation = BNmin(vault.borrowObligation.mul(vault.collateralizationRatio).div(minCollatRatioBN), BLSdiff.add(vault.borrowObligation));
  const resultantBorrowObligation = vault.borrowObligation.add(absInputAmt);
  const resultantCollateralizationRatio = vault.collateralizationRatio.mul(vault.borrowObligation).div(resultantBorrowObligation);

  const borrowObligationString = getDecimalString(vault.borrowObligation.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 3);
  const balanceDASSETString = balanceDASSET == null ? '0' : getDecimalString(balanceDASSET.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 3);
  const currentCollRatioString = getDecimalString(vault.collateralizationRatio.toString(), 16, 2);
  const resultantCollRatioString = getDecimalString(resultantCollateralizationRatio.toString(), 16, 2);

  const MIN_SAFE_COLLAT_RATIO = BN.from(process.env.REACT_APP_COLLATERALIZATION_FACTOR).add(BN.from(5)).mul(BN.from(10).pow(BN.from(16)));
  let resultantCollatRatioSafe = resultantCollateralizationRatio.gte(MIN_SAFE_COLLAT_RATIO);

  async function BroadcastTx(signer, tx) {
    console.log('Tx Initiated');
    let rec = await signer.sendTransaction(tx);
    console.log('Tx Sent', rec);
    setSentState(true);
    let resolvedRec = await rec.wait();
    console.log('Tx Resolved, resolvedRec');
    setSentState(false);
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

  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value);
    setInput(filteredValue);
  }

  const handleClickBorrow = async () => {
    try {
      if (resultantBorrowObligation.lte(maxBorrowObligation)) {
        setWaitConfirmation(true);
        await SendTx(userAddress, CMM, 'borrowFromCVault', [vault.index, absInputAmt.toString(), true]);
        setSuccess(true);
        setWaitConfirmation(false);
        setWasError(false);
      }
    } catch (err) {
      setSuccess(false);
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

  const LoadingContents = sentState ? "Borrowing DAI" : 'Waiting For Confirmation';

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
                  />
                </div>
          </div>
          <div className="d-flex justify-content-between text-part">
            <p style={{ color: "#7D8282" }}>DAI Balance</p>
            <p style={{ color: "#7D8282" }}>{balanceDASSETString} DAI</p>
          </div>
          <div className="d-flex justify-content-between text-part border_bottom">
            <p style={{ color: "#7D8282" }}>Debt amount</p>
            <div>
              <p style={{ color: "#7D8282" }}>{borrowObligationString} DAI</p>
              {/* <p style={{ color: "#7D8282" }}>→ 500.00 DAI</p> */}
            </div>
          </div>
          <div className={"d-flex justify-content-between text-part mt-2 border_bottom"} style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>
            <p>Current Coll. Ratio</p>
            <p>{currentCollRatioString}%</p>
          </div>
          <div className={"d-flex justify-content-between text-part mt-2 border_bottom"} style={resultantCollatRatioSafe ? { color: "#7D8282" } : { color: "#EF767A" }}>
            <p>Resultant Coll. Ratio</p>
            <p>{resultantCollRatioString}%</p>
          </div>
          <div className="d-flex justify-content-between text-part mt-2 border_bottom">
            <p style={{ color: "#7D8282" }}>Liquidaiton Coll. Ratio</p>
            <p style={{ color: "#7D8282" }}>{parseInt(process.env.REACT_APP_COLLATERALIZATION_FACTOR)+5}%</p>
          </div>
          <div className="d-flex justify-content-between text-part mt-2">
            <p style={{ color: "#7D8282" }}>Minimum Coll. Ratio</p>
            <p style={{ color: "#7D8282" }}>{process.env.REACT_APP_COLLATERALIZATION_FACTOR}%</p>
          </div>
        </div>

        <div className="text-center mb-4">
        {Number(balanceDASSETString) < Number(input) ?
              <button
                className="btn btn-deactive"
              >
              Insufficient Balance For Transaction
              </button>
            :
              <>
              {input === '' ?
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
                  <button className="btn btn-deactive btn-active " onClick={handleClickBorrow}> Borrow DAI</button>
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
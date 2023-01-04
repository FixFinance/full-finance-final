import React, { useState, useContext, useEffect } from 'react';
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import { EthersContext } from '../EthersProvider/EthersProvider';
import { getNonce, getSendTx } from '../../Utils/SendTx';
import { hoodEncodeABI } from '../../Utils/HoodAbi';
import { TOTAL_SBPS, INF, _0 } from '../../Utils/Consts';
import { getDecimalString } from '../../Utils/StringAlteration';
import SuccessModal from '../Success/SuccessModal';
import ErrorModal from '../ErrorModal/Errormodal';

let COLLATERAL_ADDRESSES = [];
let COLLATERAL_SYMBOLS = [];

const ClosePosition=({ handleClose, userAddress, CMM, DAI, CASSET, vault })=> {

  const [success, setSuccess] = useState(false);

  const [approval, setApproval] = useState(null);
  const [waitConfirmation, setWaitConfirmation] = useState(false);
  const [sentState, setSentState] = useState(false);
  const [error, setError] = useState(false);
  const [wasError, setWasError] = useState(false);

  const [, , updateBasicInfo] = useContext(EthersContext);

  const sufficientApproval = approval == null ? true : vault.borrowObligation.mul(BN.from(101)).div(BN.from(100)).lte(approval);

  const CollateralIndex = COLLATERAL_ADDRESSES.indexOf(CASSET.address);
  const CollateralSymbol = COLLATERAL_SYMBOLS[CollateralIndex];

  const handleClickApprove = async () => {
    if (approval != null) {
      setWaitConfirmation(true);
      await SendTx(userAddress, DAI, 'approve', [CMM.address, INF.toString()]);
      setWaitConfirmation(false);
      setSuccess(true);
      setWasError(false);
      setApproval(null);
    }
  }

  const handleClickClose = async () => {
    try {
      if (approval != null && sufficientApproval) {
        setWaitConfirmation(true);
        await SendTx(userAddress, CMM, 'closeCVault', [vault.index]);
        setWaitConfirmation(false);
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
  };

  const TxCallback0 = async () => {
    setSentState(true);
  }

  const TxCallback1 = async () => {
    setSentState(false);
    updateBasicInfo();
  }

  const SendTx = getSendTx(TxCallback0, TxCallback1);

  const handleErrorClose = () => {
    setSuccess(false);
    setError(false);
    handleClose();
  }

  useEffect(() => {
    if (approval == null) {
      DAI.allowance(userAddress, CMM.address).then(res => setApproval(res));
    }
  }, [approval]);

  const message = sufficientApproval ? `Close DAI/${CollateralSymbol} Position` : "Approve DAI";
  const onClick = sufficientApproval ? handleClickClose : handleClickApprove;
  const LoadingContents = sentState ? "Closing Position" : 'Waiting For Confirmation';

  const BaseContents = (
    !success && !error &&
    <div className="deposite-withdraw">
    <div>
      <Modal.Header closeButton className={sentState || waitConfirmation ? "deposit-header": ""}>
        <h5>Close Position (DAI/{CollateralSymbol})</h5>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center middle_part mt-3">
        <div className="text-center">
            <div className="text-part" style={{ "fontSize": "24px" ,color: "#7D8282", "maxWidth": "300px", margin: "auto", "marginBottom": "60px" }}>To close position you need to repay full debt amount</div>
        </div>
          {false && <>
          <p style={{ color: "#EDF0EB" }}>Amount to Repay</p>
          <div className="form-group mt-3">
          <div className="relative">
                <input
                    type="text"
                    className="  form-field"
                    id="exampleInput1"
                    aria-describedby="textHelp"
                    placeholder="2,000.00"
                  />
                  <div className="highlight">max</div>
          </div>
          </div>
          </>
          }
          <div className="d-flex justify-content-between text-part">
            <p style={{ color: "#7D8282" }}>Current Collateral</p>
            <p style={{ color: "#7D8282" }}>{getDecimalString(vault.amountSupplied.toString(), 18, 2)} {CollateralSymbol}</p>
          </div>

          <div className="d-flex justify-content-between text-part">
            <p style={{ color: "#7D8282" }}>Current debt</p>
            <p style={{ color: "#7D8282" }}>{getDecimalString(vault.borrowObligation.toString(), 18, 2)} DAI</p>
          </div>
        </div>

        <div className="text-center mb-4">
        {waitConfirmation ?
                  <button
                  className="btn btn-deactive"
                  >
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span className="ms-3">{LoadingContents}</span>
                  </button>
                :
                  <button className="btn btn-deactive btn-active " style={{ background: "#EF767A"}} onClick={onClick}>{message}</button>
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
    {errorModal}
    {successModal}
  </>
  );

}

export default ClosePosition;
import React, {useState, useEffect} from "react";
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import SuccessModal from "../Success/SuccessModal";
import { TOTAL_SBPS, INF, _0 } from '../../Utils/Consts';
import { SendTx } from '../../Utils/SendTx';
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';


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
    ADD_SUCCESS: 2
  }
  const [success, setSuccess] = useState(SUCCESS_STATUS.BASE);

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

  const approveCollateral = async () => {
    if (collApproval != null) {
      await SendTx(userAddress, CASSET, 'approve', [CMM.address, INF.toString()]);
      setCollApproval(null);
      setSuccess(SUCCESS_STATUS.APPROVAL_SUCCESS);
    }
  }

  const addCollateral = async () => {
    if (collApproval != null && walletBalance != null && !absInputAmt.eq(_0) && absInputAmt.lte(walletBalance)) {
      await SendTx(userAddress, CMM, 'supplyToCVault', [vault.index, absInputAmt.toString()]);
      setSuccess(SUCCESS_STATUS.ADD_SUCCESS);
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

  const sufficientApproval = collApproval == null ? true : collApproval.gte(absInputAmt);

  const buttonMessage = sufficientApproval ? "Add WETH" : "Approve WETH";
  const handleActionClick = sufficientApproval ? addCollateral : approveCollateral;

  const BaseContents = (
    success === SUCCESS_STATUS.BASE &&
    <div className="deposite-withdraw">
      <div>
        <Modal.Header closeButton>
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
            <button className="btn btn-deactive btn-active " onClick={handleActionClick}>{buttonMessage}</button>
          </div>
        </Modal.Body>
      </div>
    </div>
  );

  const successmodal = (
      <Modal
          show={success !== SUCCESS_STATUS.BASE}
          onHide={handleClosesuccess}
          centered
          animation={false}
          className="deposit-modal"
      >
          <SuccessModal handleClosesuccess={handleClosesuccess} />
      </Modal>
  );

  return (
    <>
      {BaseContents}
      {successmodal}
    </>
  );
};

export default AddCollateral;

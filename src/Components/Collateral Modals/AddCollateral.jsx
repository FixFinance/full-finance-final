import React, {useState, useEffect} from "react";
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import { TOTAL_SBPS, INF, _0 } from '../../Utils/Consts';
import { SendTx } from '../../Utils/SendTx';
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';


const AddCollateral = ({
  userAddress,
  CMM,
  CASSET,
  vault,
  forceUpdateVault
}) => {

  const [input, setInput] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);
  const [collApproval, setCollApproval] = useState(null);
  const [collatRatioCheck, setCollatRatioCheck] = useState(false); // This variable controls the color of the Implied Collateralization Ratio


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
    }
  }

  const addCollateral = async () => {
    if (collApproval != null && walletBalance != null && !absInputAmt.eq(_0) && absInputAmt.lte(walletBalance)) {
      await SendTx(userAddress, CMM, 'supplyToCVault', [vault.index, absInputAmt.toString()]);
      forceUpdateVault();
      setCollApproval(null);
      setWalletBalance(null);
      setInput('');
    }
  }


  const sufficientApproval = collApproval == null ? true : collApproval.gte(absInputAmt);

  const buttonMessage = sufficientApproval ? "Add WETH" : "Approve WETH";
  const handleActionClick = sufficientApproval ? addCollateral : approveCollateral;

  return (
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
              <p style={!collatRatioCheck ? { color: "#EF767A" } : { color: "#7D8282" }}>Implied Coll. Ratio</p>
              <p style={!collatRatioCheck ? { color: "#EF767A" } : { color: "#7D8282" }}>{impliedCollRatioString}%</p>
            </div>
            <div className="d-flex justify-content-between text-part border_bottom">
              <p style={!collatRatioCheck ? { color: "#EF767A" } : { color: "#7D8282" }}>Current Coll. Ratio</p>
              <p style={!collatRatioCheck ? { color: "#EF767A" } : { color: "#7D8282" }}>{currentCollRatioString}%</p>
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
};

export default AddCollateral;

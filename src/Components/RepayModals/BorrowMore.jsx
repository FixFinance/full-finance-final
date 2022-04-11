import React, {useState, useEffect} from "react";
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import { TOTAL_SBPS, INF, _0 } from '../../Utils/Consts';
import { SendTx } from '../../Utils/SendTx';
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration';

const BorrowMore=({
  userAddress,
  CMM,
  DAI,
  vault,
  forceUpdateVault
})=> {

  const [input, setInput] = useState('');
  const [balanceDASSET, setBalanceDASSET] = useState(null);

  useEffect(() => {
    if (balanceDASSET == null) {
      DAI.balanceOf(userAddress).then(res => setBalanceDASSET(res));
    }
  }, [balanceDASSET]);

  const absInputAmt = BN.from(getAbsoluteString(input, parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS)));

  const minCollatRatioBN = BN.from(parseInt(process.env.REACT_APP_COLLATERALIZATION_FACTOR)+5).mul(BN.from(10).pow(BN.from(16)));
  const maxBorrowObligation = vault.borrowObligation.mul(vault.collateralizationRatio).div(minCollatRatioBN);
  const resultantBorrowObligation = vault.borrowObligation.add(absInputAmt);
  const resultantCollateralizationRatio = vault.collateralizationRatio.mul(vault.borrowObligation).div(resultantBorrowObligation);

  const borrowObligationString = getDecimalString(vault.borrowObligation.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 3);
  const balanceDASSETString = balanceDASSET == null ? '0' : getDecimalString(balanceDASSET.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 3);
  const currentCollRatioString = getDecimalString(vault.collateralizationRatio.toString(), 16, 2);
  const resultantCollRatioString = getDecimalString(resultantCollateralizationRatio.toString(), 16, 2);

  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value);
    setInput(filteredValue);
  }

  const handleClickBorrow = async () => {
    if (resultantBorrowObligation.lte(maxBorrowObligation)) {
      await SendTx(CMM.borrowFromCVault(vault.index, absInputAmt, true));
      forceUpdateVault();
      setBalanceDASSET(null);
      setInput('');
    }
  }

  return (
    <div className="deposite-withdraw">
    <div>
      <Modal.Header closeButton>
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
          <div className="d-flex justify-content-between text-part mt-2 border_bottom">
            <p style={{ color: "#7D8282" }}>Current Coll. Ratio</p>
            <p style={{ color: "#7D8282" }}>{currentCollRatioString}%</p>
          </div>
          <div className="d-flex justify-content-between text-part mt-2 border_bottom">
            <p style={{ color: "#7D8282" }}>Resultant Coll. Ratio</p>
            <p style={{ color: "#7D8282" }}>{resultantCollRatioString}%</p>
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
          <button className="btn btn-deactive btn-active " onClick={handleClickBorrow}> Borrow DAI</button>
        </div>
      </Modal.Body>
    </div>
  </div>
  )
}

export default BorrowMore;
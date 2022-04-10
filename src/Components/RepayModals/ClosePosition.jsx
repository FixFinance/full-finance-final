import React, { useState, useEffect } from 'react';
import Modal from "react-bootstrap/Modal";
import { BigNumber as BN } from 'ethers';
import { SendTx } from '../../Utils/SendTx';
import { TOTAL_SBPS, INF, _0 } from '../../Utils/Consts';
import { getDecimalString } from '../../Utils/StringAlteration';

const ClosePosition=({ handleClose, userAddress, CMM, DAI, vault })=> {

  const [approval, setApproval] = useState(null);

  const sufficientApproval = approval == null ? true : vault.borrowObligation.mul(BN.from(101)).div(BN.from(100)).lte(approval);

  const handleClickApprove = async () => {
    if (approval != null) {
      await SendTx(DAI.approve(CMM.address, INF));
      setApproval(null);
    }
  }

  const handleClickClose = async () => {
    if (approval != null && sufficientApproval) {
      await SendTx(CMM.closeCVault(vault.index));
      handleClose();
    }
  };

  useEffect(() => {
    if (approval == null) {
      DAI.allowance(userAddress, CMM.address).then(res => setApproval(res));
    }
  }, [approval]);

  const message = sufficientApproval ? "Close DAI/WETH Position" : "Approve DAI";
  const onClick = sufficientApproval ? handleClickClose : handleClickApprove;

  return (
    <div className="deposite-withdraw">
    <div>
      <Modal.Header closeButton>
        <h5>Close Position (DAI/wETH)</h5>
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
            <p style={{ color: "#7D8282" }}>{getDecimalString(vault.amountSupplied.toString(), 18, 2)} WETH</p>
          </div>

          <div className="d-flex justify-content-between text-part">
            <p style={{ color: "#7D8282" }}>Current debt</p>
            <p style={{ color: "#7D8282" }}>{getDecimalString(vault.borrowObligation.toString(), 18, 2)} DAI</p>
          </div>
        </div>

        <div className="text-center mb-4">
          <button className="btn btn-deactive btn-active " style={{ background: "#EF767A"}} onClick={onClick}>{message}</button>
        </div>
        </Modal.Body>
    </div>
    </div>

    )
}

export default ClosePosition;
import React, { useState, useEffect, useContext, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import { ethers, BigNumber as BN } from 'ethers';
import "./depositmodal.scss";
import SuccessModal from "../Success/SuccessModal";
import { EthersContext } from '../EthersProvider/EthersProvider';
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration.js';
import { SendTx } from '../../Utils/SendTx';
import { ControlledInput } from '../ControlledInput/ControlledInput';

const IERC20ABI = require('../../abi/IERC20.json');
const ICoreMoneyMarketABI = require('../../abi/ICoreMoneyMarket.json');

const getPureInput = (input) => input.substring(0, input.length-4);

const WithdrawModal=({ handleClose2 })=> {
  const [success, setSuccess] = useState(false);
  const [input, setInput] = useState('');

  const [balanceLendShares, setBalanceLendShares] = useState(null);
  const [lendShareValue, setLendShareValue] = useState(null);

  const [getWalletInfo] = useContext(EthersContext);
  const [provider, userAddress] = getWalletInfo();

  const lendShareBalanceString = getDecimalString(balanceLendShares == null ? '0' : balanceLendShares.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 4);
  const lendShareValueString = getDecimalString(lendShareValue == null ? '0' : lendShareValue.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 4);
  const absoluteInput = BN.from(getAbsoluteString('0'+getPureInput(input), process.env.REACT_APP_BASE_ASSET_DECIMALS));

  const handleClosesuccess = () => {
    setSuccess(false);
    // force reload everything
    setBalanceLendShares(null);
    setLendShareValue(null);
    setInput('');
  }
  const handleShow = () => setSuccess(true);
  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value)+' FLT';
    setInput(filteredValue);
  }
  const handleClickMax = () => {
    if (balanceLendShares != null && lendShareBalanceString != null) {
      setInput(lendShareBalanceString+' FLT');
    }
  }

  const signer = provider == null ? null : provider.getSigner();
  let DAI = signer == null ? null : new ethers.Contract(process.env.REACT_APP_BASE_ASSET_ADDRESS, IERC20ABI, signer);
  let FLT = signer == null ? null : new ethers.Contract(process.env.REACT_APP_FLT_ADDRESS, IERC20ABI, signer);
  let CMM = signer == null ? null : new ethers.Contract(process.env.REACT_APP_CMM_ADDRESS, ICoreMoneyMarketABI, signer);

  const withdrawOnClick = async () => {
    if (balanceLendShares === null || lendShareValue === null) {
      return;
    }
    await SendTx(userAddress, CMM, 'withdrawSpecificShares', [userAddress, absoluteInput.toString()]);
    setSuccess(true);
  }

  useEffect(() => {
    let asyncUseEffect = async () => {
      if (provider != null && balanceLendShares == null) {
        let promise0 = FLT.balanceOf(userAddress).then(res => {
          setBalanceLendShares(res);
          return res;
        });
        let promise1 = FLT.totalSupply();
        let promise2 = CMM.getSupplyLent();

        let promiseArray = [promise0, promise1, promise2];
        let [_FLTbalance, tsFLT, supplyLent] = await Promise.all(promiseArray);
        let _lendShareValue = _FLTbalance.mul(supplyLent).div(tsFLT);
        setLendShareValue(_lendShareValue);
      }
    }
    asyncUseEffect();
  }, [balanceLendShares]);

  return (
    <div> 
        <div className="deposite-withdraw">
    {success ? null : (
      <div>
        <Modal.Header closeButton>
          <h5>Redeem FLT for DAI</h5>
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
              <p style={{ color: "#7D8282" }}>{lendShareValueString} DAI</p>
            </div>
          </div>
          <div className="text-center mb-4">
            <button
              className="btn btn-deactive btn-active "
              onClick={withdrawOnClick}
            >
              {" "}
              Withdraw DAI
            </button>
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
  </div></div>
  )
}

export default WithdrawModal;
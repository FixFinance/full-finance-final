import React, { useState, useEffect, useContext } from "react";
import Modal from "react-bootstrap/Modal";
import { ethers, BigNumber as BN } from 'ethers';
import "./depositmodal.scss";
import SuccessModal from "./SuccessModal";
import { EthersContext } from '../EthersProvider/EthersProvider';
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration.js';
import { SendTx } from '../../Utils/SendTx';
import { ControlledInput } from '../ControlledInput/ControlledInput';

const INF = '0x'+'ff'.repeat(32);
const IERC20ABI = require('../../abi/IERC20.json');
const ICoreMoneyMarketABI = require('../../abi/ICoreMoneyMarket.json');

const getPureInput = (input) => input.substring(0, input.length-4);

const DepositPopup = ({ handleClose }) => {
  const [success, setSuccess] = useState(false);

  const [input, setInput] = useState('');

  const [DAIbalance, setDAIbalance] = useState(null);
  const [DAIapproval, setDAIapproval] = useState(null);
  const [balanceLendShares, setBalanceLendShares] = useState(null);
  const [lendShareValue, setLendShareValue] = useState(null);

  const [getWalletInfo] = useContext(EthersContext);
  const [provider, userAddress] = getWalletInfo();

  const balanceString = getDecimalString(DAIbalance == null ? '0' : DAIbalance.toString(), process.env.REACT_APP_BASE_ASSET_DECIMALS, 4);
  const lsValueString = getDecimalString(lendShareValue == null ? '0' : lendShareValue.toString(), process.env.REACT_APP_BASE_ASSET_DECIMALS, 4);
  const absoluteInput = BN.from(getAbsoluteString('0'+getPureInput(input), process.env.REACT_APP_BASE_ASSET_DECIMALS));

  const handleClosesuccess = () => {
    setSuccess(false);
    // force reload everything
    setDAIbalance(null);
    setDAIapproval(null);
    setBalanceLendShares(null);
    setLendShareValue(null);
    setInput('');
  }
  const handleShow = () => setSuccess(true);
  const handleInput = (param) => {
    let value = param.target.value;
    let filteredValue = filterInput(value)+' DAI';
    setInput(filteredValue);
  }
  const handleClickMax = () => {
    if (DAIbalance != null && balanceString != null) {
      setInput(balanceString+' DAI');
    }
  }

  const signer = provider == null ? null : provider.getSigner();
  let DAI = signer == null ? null : new ethers.Contract(process.env.REACT_APP_BASE_ASSET_ADDRESS, IERC20ABI, signer);
  let FLT = signer == null ? null : new ethers.Contract(process.env.REACT_APP_FLT_ADDRESS, IERC20ABI, signer);
  let CMM = signer == null ? null : new ethers.Contract(process.env.REACT_APP_CMM_ADDRESS, ICoreMoneyMarketABI, signer);

  const depositOnClick = async () => {
    if (DAIbalance === null || DAIapproval === null || balanceLendShares === null) {
      return;
    }
    if (absoluteInput.gt(DAIapproval) || DAIapproval.eq(BN.from(0))) {
      await SendTx(DAI.approve(CMM.address, INF));
    }
    else {
      await SendTx(CMM.depositSpecificUnderlying(userAddress, absoluteInput));
    }
    setSuccess(true);
  };

  const handleDeposit = async () => {};
  const handleApprove = async () => {};

  useEffect(() => {
    let asyncUseEffect = async () => {
      if (provider != null && DAIbalance == null) {
        let promise0 = DAI.balanceOf(userAddress).then(res => {
          setDAIbalance(res);
          return res;
        });
        let promise1 = DAI.allowance(userAddress, CMM.address).then(res => {
          setDAIapproval(res);
          return res;
        });
        let promise2 = FLT.balanceOf(userAddress).then(res => {
          setBalanceLendShares(res);
          return res;
        });
        let promise3 = FLT.totalSupply();
        let promise4 = CMM.getSupplyLent();

        let promiseArray = [promise0, promise1, promise2, promise3, promise4];
        let [ , , _FLTbalance, tsFLT, supplyLent] = await Promise.all(promiseArray);
        let _lendShareValue = _FLTbalance.mul(supplyLent).div(tsFLT);
        setLendShareValue(_lendShareValue);
      }
    }
    asyncUseEffect();
  }, [DAIbalance]);

  const ButtonContents = ![DAIbalance, DAIapproval].includes(null) && DAIapproval.lt(absoluteInput) ? 'Approve DAI' : 'Deposit DAI'

  return (
    <div className="deposite-withdraw">
      {success ? null : (
        <div>
          <Modal.Header closeButton>
            <h5>Deposit DAI</h5>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center middle_part mt-3">
              <p style={{ color: "#EDF0EB" }}>Amount to deposit</p>
              <div className="form-group mt-3">
                
                <div className="relative">
                <ControlledInput
                    type="text"
                    className="  form-field"
                    id="exampleInput1"
                    aria-describedby="textHelp"
                    onChange={handleInput}
                    placeholder="           0.00 DAI "
                    value={input}
                  />
                  <div className="highlight" onClick={handleClickMax}>max</div>
                </div>
                 
               
              </div>
              <div className="d-flex justify-content-between text-part">
                <p style={{ color: "#7D8282" }}>Wallet balance</p>
                <p style={{ color: "#7D8282" }}>{balanceString} DAI</p>
              </div>

              <div className="d-flex justify-content-between text-part">
                <p style={{ color: "#7D8282" }}>Deposit Balance</p>
                <p style={{ color: "#7D8282" }}>{lsValueString} DAI</p>
              </div>

            </div>
            <div className="text-center mb-4">
              <button
                className="btn btn-deactive btn-active "
                onClick={depositOnClick}
              >
                {" "}
                {ButtonContents}
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
    </div>
  );
};

export default DepositPopup;

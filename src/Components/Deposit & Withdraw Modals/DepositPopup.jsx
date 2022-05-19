import React, { useState, useEffect, useContext } from "react";
import Modal from "react-bootstrap/Modal";
import { ethers, BigNumber as BN } from 'ethers';
import "./depositmodal.scss";
import SuccessModal from "../Success/SuccessModal";
import ErrorModal from "../ErrorModal/Errormodal";
import { EthersContext } from '../EthersProvider/EthersProvider';
import { filterInput, getDecimalString, getAbsoluteString } from '../../Utils/StringAlteration.js';
import { SendTx } from '../../Utils/SendTx';
import { INF } from '../../Utils/Consts';
import { ControlledInput } from '../ControlledInput/ControlledInput';

const IERC20ABI = require('../../abi/IERC20.json');
const ICoreMoneyMarketABI = require('../../abi/ICoreMoneyMarket.json');

const getPureInput = (input) => input.substring(0, input.length-4);

const DepositPopup = ({ handleClose }) => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [waitConfirmation, setWaitConfirmation] = useState(false);

  const [input, setInput] = useState('');

  const [DAIbalance, setDAIbalance] = useState(null);
  const [DAIapproval, setDAIapproval] = useState(null);
  const [balanceLendShares, setBalanceLendShares] = useState(null);
  const [lendShareValue, setLendShareValue] = useState(null);

  const [getWalletInfo] = useContext(EthersContext);
  const [provider, userAddress] = getWalletInfo();

  const balanceString = getDecimalString(DAIbalance == null ? '0' : DAIbalance.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 4);
  const lsValueString = getDecimalString(lendShareValue == null ? '0' : lendShareValue.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 4);
  const absoluteInput = BN.from(getAbsoluteString('0'+getPureInput(input), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS)));

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
  const handleError = () => setError(true);

  const handleErrorClose = () => setError(false);

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
      await SendTx(userAddress, DAI, 'approve', [CMM.address, INF.toString()]);
    }
    else {
      setWaitConfirmation(true);
      await SendTx(userAddress, CMM, 'depositSpecificUnderlying', [userAddress, absoluteInput.toString()]);
      // setWaitConfirmation(false);
      // setTransaction(true);
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
          console.log(DAIbalance);
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
  }, [DAIbalance, provider]);

  const ButtonContents = ![DAIbalance, DAIapproval].includes(null) && DAIapproval.lt(absoluteInput) ? 'Approve DAI' : 'Deposit DAI'

  return (
    <div className="deposite-withdraw">
      {success || error ? null : (
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
                <p style={{ color: "#7D8282" }}>Wallet Balance</p>
                <p style={{ color: "#7D8282" }}>{balanceString} DAI</p>
              </div>

              <div className="d-flex justify-content-between text-part">
                <p style={{ color: "#7D8282" }}>Deposit Balance</p>
                <p style={{ color: "#7D8282" }}>{lsValueString} DAI</p>
              </div>

            </div>
            <div className="text-center mb-4">
            {DAIbalance === 0 ?
              <button
                className="btn btn-deactive"
              >
              Insufficient Balance For Transaction
              </button>
            :
              <>
              {input === '' ?
                <button
                  className="btn btn-deactive"
                >
                Enter an amount
                </button>
              :
                <>
                {waitConfirmation ?
                  <button
                  className="btn btn-deactive"
                  >
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span className="ms-3">Waiting For Confirmation</span>
                  </button>
                :
                  <button
                    className="btn btn-deactive btn-active "
                    onClick={depositOnClick}
                  >
                    {" "}
                    {ButtonContents}
                  </button>
                }
                </>
              }
              </>
            }
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

      <Modal
        show={error}
        onHide={handleErrorClose}
        centered
        animation={false}
        className="deposit-modal"
      >
        <ErrorModal  />
      </Modal>
    </div>
  );
};

export default DepositPopup;

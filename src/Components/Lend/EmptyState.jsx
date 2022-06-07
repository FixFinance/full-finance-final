import React, { useState, useContext, useEffect } from "react";
import question from "../../assets/image/question.svg";
import dai from "../../assets/image/dai.svg";
import Modal from "react-bootstrap/Modal";
import DepositPopup from "../Deposit & Withdraw Modals/DepositPopup";
import WithdrawModal from "../Deposit & Withdraw Modals/WithdrawModal";
import ConnectModal from "../ConnectWallet/ConnectModal";
import { ethers, BigNumber as BN } from 'ethers';
import { EthersContext } from '../EthersProvider/EthersProvider';
import { getDecimalString } from '../../Utils/StringAlteration';
import { getAnnualizedRate, TOTAL_SBPS } from '../../Utils/RateMath';
import Header from "../../ShareModules/Layout/Header/Header";

const IERC20ABI = require('../../abi/IERC20.json');
const ICoreMoneyMarketABI = require('../../abi/ICoreMoneyMarket.json');
const IChainlinkAggregatorABI = require('../../abi/IChainlinkAggregator.json');

const EmptyState = () => {
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);

  const [balanceLendShares, setBalanceLendShares] = useState(null);
  const [lendShareValue, setLendShareValue] = useState(null);
  const [lendShareUSDValue, setLendShareUSDValue] = useState(null);

  const [getWalletInfo, getBasicInfo, updateBasicInfo] = useContext(EthersContext);
  const { annualLendRateString } = getBasicInfo();
  const [provider, userAddress] = getWalletInfo();

  if (annualLendRateString == '0') {
    updateBasicInfo();
  }

  const handleClose = () => {
    setShow(false);
    setBalanceLendShares(null);
    setLendShareValue(null);
  }
  const handleShow = () => setShow(true);

  const handleClose2 = () => {
    setShow2(false);
    setBalanceLendShares(null);
    setLendShareValue(null);
  }
  const handleShow2 = () => setShow2(true);

  const handleClose3 = () => {
    setShow3(false);
  }
  const handleShow3 = () => setShow3(true);


  const lendShareValueString = getDecimalString(lendShareValue == null ? '0.0000' : lendShareValue.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 4);
  const lendShareUSDValueString = getDecimalString(lendShareUSDValue == null ? '0.0000' : lendShareUSDValue.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 4);

  const signer = provider == null ? null : provider.getSigner();
  let DAI = signer == null ? null : new ethers.Contract(process.env.REACT_APP_BASE_ASSET_ADDRESS, IERC20ABI, signer);
  let FLT = signer == null ? null : new ethers.Contract(process.env.REACT_APP_FLT_ADDRESS, IERC20ABI, signer);
  let CMM = signer == null ? null : new ethers.Contract(process.env.REACT_APP_CMM_ADDRESS, ICoreMoneyMarketABI, signer);
  let BaseAgg = signer == null ? null : new ethers.Contract(process.env.REACT_APP_BASE_ASSET_AGGREGATOR_ADDRESS, IChainlinkAggregatorABI, signer);

  useEffect(() => {
    let asyncUseEffect = async () => {
      if (provider != null && balanceLendShares == null) {
        let promiseArray = [
          FLT.balanceOf(userAddress).then(res => {
            setBalanceLendShares(res);
            return res;
          }),
          FLT.totalSupply(),
          CMM.getSupplyLent(),
          BaseAgg.latestAnswer(),
          BaseAgg.decimals()
        ];

        let [_FLTbalance, tsFLT, supplyLent, baseAnswer, baseAggDecimals] = await Promise.all(promiseArray);
        let _lendShareValue = _FLTbalance.mul(supplyLent).div(tsFLT);
        let denominator = BN.from(10).pow(BN.from(baseAggDecimals.toString()));
        let _lendShareUSDValue = _lendShareValue.mul(baseAnswer).div(denominator);
        setLendShareValue(_lendShareValue);
        setLendShareUSDValue(_lendShareUSDValue);
      }
    }
    asyncUseEffect();
  }, [provider, balanceLendShares]);

  return (
    <>
    <div className="empty" style={signer ? {"min-height" : "445px"} : {"min-height" : "370px"}}>
      <div>
        <div className="d-flex justify-content-between">
          <span>Your Deposit Balance</span>
        </div>
        <div className="flex_class margin_small">
          <div className="d-flex">
            <div className="d-block">
              <img src={dai} alt="img" className="dai_img" />
              <p className="lend-share-value">$ {lendShareUSDValueString}</p>
            </div>
            <h5 className="lend-share-value-bold">{lendShareValueString}</h5>
            <h5>DAI</h5>
          </div>
          <p className="lend-share-value-mobile">$ {lendShareUSDValueString}</p>
          <div className="deposit-container">
            <h5 className="m-0">{annualLendRateString} %</h5>
            <p className="text-white ">Deposit APR</p>
          </div>
        </div>
        {signer !== null ?
        <div className="margin_small">
          <div className="text-center">
            <button className="btn common_btn deposit" onClick={handleShow}>Deposit DAI</button>
          </div>
          <div className="text-center">
            <button className="btn common_btn withdraw" onClick={handleShow2}>Withdraw DAI</button>
          </div>
        </div>
        :
        <div className="margin_small">
          <div className="text-center">
            <button className="btn common_btn deposit" onClick={handleShow3}>Connect Wallet</button>
          </div>
        </div>
        }
      </div>
      <Modal
          show={show}
          onHide={handleClose}
          centered
          animation={false}
          className="deposit-modal"
        >
          <DepositPopup handleClose={handleClose} />
        </Modal>
        <Modal
          show={show2}
          onHide={handleClose2}
          centered
          animation={false}
          className="deposit-modal"
        >
          <WithdrawModal handleClose2={handleClose2} />
        </Modal>
        <Modal
          show={show3}
          onHide={handleClose3}
          centered
          animation={false}
          className="connect-wallet-modal"
        >
          <ConnectModal handleClose2={handleClose3} />
        </Modal>
    </div>
    </>
  );
};

export default EmptyState;

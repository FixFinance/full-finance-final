import React, { useState, useContext, useEffect } from "react";
import question from "../../assets/image/question.svg";
import Modal from "react-bootstrap/Modal";
import DepositPopup from "../Deposit & Withdraw Modals/DepositPopup";
import WithdrawModal from "../Deposit & Withdraw Modals/WithdrawModal";
import ConnectModal from "../ConnectWallet/ConnectModal";
import { ethers, BigNumber as BN } from 'ethers';
import { EthersContext } from '../EthersProvider/EthersProvider';
import { LoginContext } from "../../helper/userContext";
import { getDecimalString } from '../../Utils/StringAlteration';
import { getAnnualizedRate, TOTAL_SBPS } from '../../Utils/RateMath';
import { getFLTUnderlyingValueString, getFLTUSDValueString } from '../../Utils/EthersStateProcessing';
import { LOGO_MAP } from '../../Utils/LogoMap';
import Header from "../../ShareModules/Layout/Header/Header";
import dropdown_button from '../../assets/image/dropdown-button.svg';
import dropdown_deactive from '../../assets/image/dropdown_deactive.svg'

const IERC20ABI = require('../../abi/IERC20.json');
const ICoreMoneyMarketABI = require('../../abi/ICoreMoneyMarket.json');
const IChainlinkAggregatorABI = require('../../abi/IChainlinkAggregator.json');

const ENV_TICKERS = JSON.parse(process.env.REACT_APP_TICKERS);
const ENV_ASSET_ADDRESSES = JSON.parse(process.env.REACT_APP_LISTED_ASSETS);
const ENV_ESCROWS = JSON.parse(process.env.REACT_APP_ESCROWS);
const ENV_FLTS = JSON.parse(process.env.REACT_APP_FLTS);

const EmptyState = () => {
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);

  const [getWalletInfo, getBasicInfo, updateBasicInfo] = useContext(EthersContext);
  const BasicInfo = getBasicInfo();
  const { fltBals, irmInfo, aggInfo, assetBals, assetAllowances } = BasicInfo;
  const [provider, userAddress] = getWalletInfo();
  const signer = provider == null ? null : provider.getSigner();

  const [selectedAsset, setSelectedAsset] = useState("DAI");
  const [menu, setMenu] = useState(false);

  const setSelectedAssetHandler = (asset) => {
      setMenu(false);
      setSelectedAsset(asset);
  }

  const handleClose = () => {
    setShow(false);
  }
  const handleShow = () => setShow(true);

  const handleClose2 = () => {
    setShow2(false);
  }
  const handleShow2 = () => setShow2(true);

  const handleClose3 = () => {
    setShow3(false);
  }
  const handleShow3 = () => setShow3(true);



  const  ENV_INDEX = ENV_TICKERS.indexOf(selectedAsset);

  const CollateralInput = selectedAsset ? selectedAsset : "Choose Asset";
  const CollateralClass = selectedAsset.toLowerCase()+"-asset-span";
  const SelectedLogo = LOGO_MAP[selectedAsset];

  let dropdownItems = ENV_TICKERS.map((ticker, i) => {
    let tickerLower = ticker.toLowerCase();
    i = i === 0 ? "" : i+1;
    let containerClassName = "list-element"+i+"-container";
    return (
      <li onClick={() => setSelectedAssetHandler(ticker)}>
        <div className={containerClassName}>
          <span><img className="dropdown-asset-image" src={LOGO_MAP[ticker]} alt={tickerLower+" logo"} /></span>
          <span className={tickerLower+"-asset-span"}>{ticker}</span>
        </div>
      </li>
    );
  });

  let dropdown = (
    <div className="managepopup_details">
      <div className="amount_section mb-4">
          <h4>Choose An Asset To Manage</h4>
          <button className="btn dropdown-toggle" style={{ "height" : "44px", "padding" : "5px 0px"}} type="button" onClick={/*waitConfirmation || sentState*/false ? "" : () => setMenu(!menu)} >
                  <span><img className={selectedAsset ? "asset-image" : "d-none"} src={SelectedLogo} alt="asset logo" /></span>
                  <span className={selectedAsset ? CollateralClass : "choose-asset-span"}>{CollateralInput}</span>
                  <span><img className={menu ? "rotated-up-arrow" : "rotated-down-arrow"} src={/*waitConfirmation || sentState*/false ? dropdown_deactive : dropdown_button} alt="dropdown button"/></span>
          </button>
          <ul className={menu ? "asset-menu" : "d-none"} >
              {dropdownItems}
          </ul>
        </div>
    </div>
  );

  let underlyingValString = getFLTUnderlyingValueString(fltBals, irmInfo, ENV_INDEX);
  let usdValString = getFLTUSDValueString(fltBals, irmInfo, aggInfo, ENV_INDEX);

  let info = (
    <>
      <div className="flex_class margin_small">
        <div className="d-flex">
          <div className="d-block">
            <img src={SelectedLogo} alt="img" className="dai_img" />
            <p className="lend-share-value">$ {usdValString}</p>
          </div>
          <h5 className="lend-share-value-bold">{underlyingValString}</h5>
          <h5>{selectedAsset}</h5>
        </div>
        <p className="lend-share-value-mobile">$ {usdValString}</p>

      </div>
      <div className="flex_class margin_small">
        <div className="deposit-container">
          <h5 className="m-0">{irmInfo === null ? '0' : irmInfo[ENV_INDEX].annualLendRateString} %</h5>
          <p className="text-white ">Lend APY</p>
        </div>
        <div className="deposit-container">
          <h5 className="m-0">{irmInfo === null ? '0' : irmInfo[ENV_INDEX].annualBorrowRateString} %</h5>
          <p className="text-white ">Borrow APR</p>
        </div>

      </div>
    </>
  );

  return (
    <>
    <div className="empty" style={signer ? {"min-height" : "445px"} : {"min-height" : "370px"}}>
      <div>
        {dropdown}
        {info}
        {signer !== null ?
        <div className="margin_small">
          <div className="text-center">
            <button className="btn common_btn deposit" onClick={handleShow}>Deposit {selectedAsset}</button>
          </div>
          <div className="text-center">
            <button className="btn common_btn withdraw" onClick={handleShow2}>Withdraw {selectedAsset}</button>
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
          <DepositPopup handleClose={handleClose} assetEnvIndex={ENV_INDEX} basicInfo={BasicInfo} />
        </Modal>
        <Modal
          show={show2}
          onHide={handleClose2}
          centered
          animation={false}
          className="deposit-modal"
        >
          <WithdrawModal handleClose2={handleClose2} assetEnvIndex={ENV_INDEX} basicInfo={BasicInfo} />
        </Modal>
        <Modal
          show={show3}
          onHide={handleClose3}
          centered
          animation={false}
          className="connect-wallet-modal"
        >
          <ConnectModal handleClose={handleClose3} />
        </Modal>
    </div>
    </>
  );
};

export default EmptyState;

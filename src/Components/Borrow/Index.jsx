import React, { useState, useContext, useEffect } from "react";
import "./borrow.scss";
import dai from "../../assets/image/dai.svg";
import weth from "../../assets/image/weth.svg";
import wstETH from "../../assets/image/lidosteth.png";
import ratio_question from "../../assets/image/ratio_question.svg";
import t_icon from "../../assets/image/t_icon.png";
import Modal from "react-bootstrap/Modal";
import ManagePopup from './ManageModal/ManagePopup';
import ManagePositionPopup from './ManageModal/ManagePositionPopup';
import ConnectModal from "../ConnectWallet/ConnectModal";
import { ethers, BigNumber as BN } from 'ethers';
import { EthersContext } from '../EthersProvider/EthersProvider';
import { LoginContext } from "../../helper/userContext";
import { getDecimalString } from '../../Utils/StringAlteration';
import { getAnnualizedRate } from '../../Utils/RateMath';
import { ADDRESS0, TOTAL_SBPS, _0, COLLATERAL_ADDRESSES, COLLATERAL_SYMBOLS, COLLATERAL_AGGREGATOR_ADDRESSES, COLLATERAL_AGGREGATOR_ADDRESSES_LCASE } from '../../Utils/Consts.js';
import Header from "../../ShareModules/Layout/Header/Header";

const ICoreMoneyMarketABI = require('../../abi/ICoreMoneyMarket.json');
const IERC20ABI = require('../../abi/IERC20.json');
const IChainlinkAggregatorABI = require('../../abi/IChainlinkAggregator.json');

function Index() {
  const [modal1, setModal1] = useState(false);
  const [modal2, setModal2] = useState(false);
  const [modal3, setModal3] = useState(false);

  const [selectedVaultIndex, setSelectedVaultIndex] = useState(null);
  const [selectedVault, setSelectedVault] = useState(null);

  const [userVaults, setUserVaults] = useState(null);
  const [supplyBorrowed, setSupplyBorrowed] = useState(null);
  const [supplyBorrowShares, setSupplyBorrowShares] = useState(null);
  const [baseAggAnswer, setBaseAggAnswer] = useState(null);
  const [baseAggDecimals, setBaseAggDecimals] = useState(null);
  const [collateralAggAnswerArr, setCollateralAggAnswerArr] = useState(null);
  const [collateralAggDecimalsArr, setCollateralAggDecimalsArr] = useState(null);

  const [getWalletInfo, getBasicInfo, updateBasicInfo] = useContext(EthersContext);
  const {
    annualLendRateString,
    annualBorrowRateString,
    supplyLentBN,
    supplyBorrowedBN
  } = getBasicInfo();

  const [provider, userAddress] = getWalletInfo();
  const signer = provider == null ? null : provider.getSigner();

  if (
    annualLendRateString == '0' &&
    annualBorrowRateString == '0'
  ) {
    updateBasicInfo();
  }

  const forceUpdateVault = () => {
    if (selectedVault !== null) {
      setSelectedVaultIndex(selectedVault.index);
    }
    setUserVaults(null);
  }

  const closeManagePosition = () => {
    setModal1(false);
    setUserVaults(null);
    setSupplyBorrowed(null);
    setSupplyBorrowShares(null);
    setSelectedVault(null);
    updateBasicInfo();
  }
  const clickManagePositionFactory = (vault) => {
    const clickManagePosition = () => {
      setModal1(true);
      setSelectedVault(vault);
    }
    return clickManagePosition;
  };
  const handleClose2 = () => {
    setModal2(false);
    setUserVaults(null);
    setSupplyBorrowed(null);
    setSupplyBorrowShares(null);
    updateBasicInfo();
  }
  const handleShow2 = () => {
    if (
        signer !== null &&
        userAddress !== ADDRESS0 &&
        supplyBorrowed !== null &&
        supplyBorrowShares !== null
    ) {
      setModal2(true);
    }
  }

  const handleClose3 = () => {
    setModal3(false);
    // setXData('/');
  }
  const handleShow3 = () => setModal3(true);

  const CMM = signer == null ? null : new ethers.Contract(process.env.REACT_APP_CMM_ADDRESS, ICoreMoneyMarketABI, signer);
  const DAI = signer == null ? null : new ethers.Contract(process.env.REACT_APP_BASE_ASSET_ADDRESS, IERC20ABI, signer);  
  const CASSET = signer == null || selectedVault == null ? null : new ethers.Contract(selectedVault.assetSupplied, IERC20ABI, signer);
  const BaseAgg = signer == null ? null : new ethers.Contract(process.env.REACT_APP_BASE_ASSET_AGGREGATOR_ADDRESS, IChainlinkAggregatorABI, signer);

  useEffect(() => {
    let asyncUseEffect = async () => {
      if (signer !== null) {
        if (
            userVaults === null &&
            baseAggAnswer !== null &&
            baseAggDecimals !== null &&
            collateralAggAnswerArr !== null &&
            collateralAggDecimalsArr !== null &&
            supplyBorrowed !== null &&
            supplyBorrowShares !== null
        ) {
          CMM.getAllCVaults().then(allVaults => {
            let _selectedVault = selectedVault;
            let _selectedVaultIndex = selectedVaultIndex;
            let mappedVaults = allVaults
              .map((vault, i) => ({index: i, ...vault}));
            let _userVaults = allVaults
              .map((vault, i) => ({index: i, ...vault}))
              .filter(vault => vault.vaultOwner.toLowerCase() === userAddress.toLowerCase())
              .map(vault => {
                let collateralIndex = COLLATERAL_ADDRESSES.indexOf(vault.assetSupplied);
                let collateralAggAnswer = collateralAggAnswerArr[collateralIndex];
                let collateralAggDecimals = collateralAggDecimalsArr[collateralIndex];
                let borrowInflator = BN.from(10).pow(BN.from(process.env.REACT_APP_BASE_ASSET_DECIMALS));
                let borrowAggInflator = BN.from(10).pow(baseAggDecimals);
                let borrowObligation = vault.borrowSharesOwed.mul(supplyBorrowed).div(supplyBorrowShares);
                let borrowUSDValue = borrowObligation.mul(baseAggAnswer).mul(TOTAL_SBPS).div(borrowInflator).div(borrowAggInflator);
                let collateralInflator = BN.from(10).pow(BN.from(process.env.REACT_APP_COLLATERAL_DECIMALS));
                let collateralAggInflator = BN.from(10).pow(collateralAggDecimals);
                let collateralUSDValue = vault.amountSupplied.mul(collateralAggAnswer).mul(TOTAL_SBPS).div(collateralInflator).div(collateralAggInflator);
                let collateralizationRatio = collateralUSDValue.mul(TOTAL_SBPS).div(borrowUSDValue);
                let toReturn = {borrowObligation, borrowUSDValue, collateralUSDValue, collateralizationRatio, ...vault};
                if (selectedVault !== null && selectedVaultIndex !== null && selectedVaultIndex === toReturn.index) {
                  _selectedVault = toReturn;
                  _selectedVaultIndex = null;
                }
                return toReturn;
              })
            // Get the collateral type from a call in the above section
            setUserVaults(_userVaults);
            setSelectedVault(_selectedVault);
            setSelectedVaultIndex(_selectedVaultIndex);
          });
        }
        if (supplyBorrowed === null) {
          CMM.getSupplyBorrowed().then(res => setSupplyBorrowed(res));
        }
        if (supplyBorrowShares === null) {
          CMM.getTotalSupplyBorrowShares().then(res => setSupplyBorrowShares(res));
        }
        if (baseAggAnswer == null) {
          BaseAgg.latestAnswer().then(res => setBaseAggAnswer(res));
        }
        if (baseAggDecimals == null) {
          BaseAgg.decimals().then(res => setBaseAggDecimals(res));
        }
        if ((collateralAggAnswerArr == null || collateralAggDecimalsArr == null) && signer != null) {
          const CollateralAggArr = COLLATERAL_AGGREGATOR_ADDRESSES.map(aggAddr => new ethers.Contract(aggAddr, IChainlinkAggregatorABI, signer));
          if (collateralAggAnswerArr == null) {
            Promise.all(CollateralAggArr.map(x => x.latestAnswer())).then(res => setCollateralAggAnswerArr(res));
          }
          if (collateralAggDecimalsArr == null) {
            Promise.all(CollateralAggArr.map(x => x.decimals())).then(res => setCollateralAggDecimalsArr(res));
          }
        }
      }
    };
    asyncUseEffect();
  });

  const vaultComponents = ([userVaults, supplyBorrowed, supplyBorrowShares].includes(null) ? [] : userVaults)
    .map(vault => {
      let collateralAsset = vault.assetSupplied;
      let collateralIndex = COLLATERAL_ADDRESSES.indexOf(collateralAsset);
      let collateralSymbol = COLLATERAL_SYMBOLS[collateralIndex];
      let collateralAggAnswer = collateralAggAnswerArr == null ? null : collateralAggAnswerArr[collateralIndex];
      let collateralAggDecimals = collateralAggDecimalsArr == null ? null : collateralAggDecimalsArr[collateralIndex];
      let collateralImage = collateralSymbol === "WETH" ? weth : wstETH;
      let borrowObligation = vault.borrowSharesOwed.mul(supplyBorrowed).div(supplyBorrowShares);
      let borrowUSDValue = baseAggAnswer == null || baseAggDecimals == null ? _0 : borrowObligation.mul(baseAggAnswer).div(BN.from(10).pow(baseAggDecimals));
      let collateralUSDValue = collateralAggAnswer == null || collateralAggDecimals == null ? _0 : vault.amountSupplied.mul(collateralAggAnswer).div(BN.from(10).pow(collateralAggDecimals));
      let borrowString = getDecimalString(borrowObligation.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 2);
      let borrowUSDString = getDecimalString(borrowUSDValue.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 2);
      let collateralString = getDecimalString(vault.amountSupplied.toString(), parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS), 5);
      let collateralUSDString = getDecimalString(collateralUSDValue.toString(), parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS), 5);
      let collateralizationRatio = collateralUSDValue.eq(_0) || borrowUSDValue.eq(_0) ? _0 : collateralUSDValue.mul(TOTAL_SBPS).div(borrowUSDValue);
      let collateralizationRatioString = collateralizationRatio == null ? '0' : getDecimalString(collateralizationRatio.toString(), 16, 2);
      return (
        <div className="row borrow_position_wrap">
          <h4>DAI / {collateralSymbol}</h4>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_position_box">
              <h5>Total debt</h5>
              <h2><img src={dai} alt="img" className="vault_icon"/> {borrowString} DAI</h2>
              <p>~ $ {borrowUSDString}</p>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_position_box">
              <h5>Collateral Value</h5>
              <h2><img src={collateralImage} alt="collateral_image" className="vault_icon"/> {collateralString} {collateralSymbol}</h2>
              <p>~ $ {collateralUSDString}</p>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_position_box">
              <h5>Collateralization Ratio</h5>
              <h2>{collateralizationRatioString}%</h2>
              <p>{process.env.REACT_APP_COLLATERALIZATION_FACTOR}% min. collateralization ratio</p>
            </div>
          </div>
          <div className="mx-auto">
            <div onClick={clickManagePositionFactory(vault)} className="borrow_position_box total_debt_box">
              <button><h5>Manage position</h5></button>
            </div>
          </div>
        </div>
      );
    });
  const borrowMessage = vaultComponents.length > 0 ? 'Your Borrow Positions' : 'No Borrow Positions';

  return (
    <div>
    <Header z={true}/>
      <section className="borrow_section">
        <div className="container">
        <div className="row">
          <div className="col-lg-4 col-md-4">
            <div className="borrow_box">
              <h5>Lend Rate</h5>
              <div className="borrow_box_text">
                <h2>{annualLendRateString} %</h2>
                <p>Lend Variable APR</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_box">
              <h5>Borrow Rate</h5>
              <div className="borrow_box_text">
                <h2>{annualBorrowRateString} %</h2>
                <p>Borrow Variable APR</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_box_add" onClick={() => handleShow2()}>
              <div className="plus_added"
              >
                <div style={{ "font-size" : "45px"}}>+</div>
                <p>Open Borrowing Positions</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="borrow_section">
        <div className="container">
          <div className="row borrow_position">
          {signer !== null ?
            <>
              <h4 className="vault-header">{borrowMessage}</h4>
                {vaultComponents}
            </>
          :
          <div>
            <div className="col text-center">
              <h4 className="vault-header">Connect Wallet to See Your Borrow Positions</h4>
              <button className="btn connect-wallet-borrow" onClick={handleShow3}>Connect Wallet</button>
            </div>
          </div>
          }
          </div>
        </div>
      </section>

        <Modal
          show={modal1}
          onHide={closeManagePosition}
          centered
          animation={false}
          className="deposit-modal"
        >
          <ManagePopup 
            handleClose={closeManagePosition}
            signer={signer}
            userAddress={userAddress}
            CMM={CMM}
            DAI={DAI}
            CASSET={CASSET}
            vault={selectedVault}
            supplyBorrowed={supplyBorrowed}
            supplyBorrowShares={supplyBorrowShares}
            forceUpdateVault={forceUpdateVault}
            supplyLentBN={supplyLentBN}
            supplyBorrowedBN={supplyBorrowedBN}
          />
        </Modal>

        <Modal
          show={modal2}
          onHide={handleClose2}
          centered
          animation={false}
          className="deposit-modal"
        >
          <ManagePositionPopup
            handleClose={handleClose2}
            signer={signer}
            userAddress={userAddress}
            CMM={CMM}
            DAI={DAI}
            userVaults={userVaults}
            supplyBorrowed={supplyBorrowed}
            supplyBorrowShares={supplyBorrowShares}
            baseAggAnswer={baseAggAnswer}
            baseAggDecimals={baseAggDecimals}
            collateralAggAnswerArr={collateralAggAnswerArr}
            collateralAggDecimalsArr={collateralAggDecimalsArr}
            supplyLentBN={supplyLentBN}
            supplyBorrowedBN={supplyBorrowedBN}
          />
        </Modal>

        <Modal
          show={modal3}
          onHide={handleClose3}
          centered
          animation={false}
          className="connect-wallet-modal"
        >
          <ConnectModal handleClose={handleClose3}/>
        </Modal>

    </div>
  )
}

export default Index;
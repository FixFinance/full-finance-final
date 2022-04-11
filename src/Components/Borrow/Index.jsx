import React, { useState, useContext, useEffect } from "react";
import "./borrow.scss";
import debt_icon from "../../assets/image/rupee.svg";
import collateral_value from "../../assets/image/collateral_value.svg";
import ratio_question from "../../assets/image/ratio_question.svg";
import t_icon from "../../assets/image/t_icon.png";
import Modal from "react-bootstrap/Modal";
import ManagePopup from './ManageModal/ManagePopup';
import ManagePositionPopup from './ManageModal/ManagePositionPopup';
import { ethers, BigNumber as BN } from 'ethers';
import { EthersContext } from '../EthersProvider/EthersProvider';
import { getDecimalString } from '../../Utils/StringAlteration';
import { getAnnualizedRate } from '../../Utils/RateMath';
import { ADDRESS0, TOTAL_SBPS, _0 } from '../../Utils/Consts.js';

const ICoreMoneyMarketABI = require('../../abi/ICoreMoneyMarket.json');
const IERC20ABI = require('../../abi/IERC20.json');
const IChainlinkAggregatorABI = require('../../abi/IChainlinkAggregator.json');

function Index() {
  const [modal1, setModal1] = useState(false);
  const [modal2, setModal2] = useState(false);

  const [selectedVaultIndex, setSelectedVaultIndex] = useState(null);
  const [selectedVault, setSelectedVault] = useState(null);

  const [annualLendRate, setAnnualLendRate] = useState('0');
  const [annualBorrowRate, setAnnualBorrowRate] = useState('0');
  const [userVaults, setUserVaults] = useState(null);
  const [supplyBorrowed, setSupplyBorrowed] = useState(null);
  const [supplyBorrowShares, setSupplyBorrowShares] = useState(null);
  const [baseAggAnswer, setBaseAggAnswer] = useState(null);
  const [baseAggDecimals, setBaseAggDecimals] = useState(null);
  const [collateralAggAnswer, setCollateralAggAnswer] = useState(null);
  const [collateralAggDecimals, setCollateralAggDecimals] = useState(null);

  const [getWalletInfo] = useContext(EthersContext);
  const [provider, userAddress] = getWalletInfo();

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
  }
  const handleShow2 = () => {
    if (
        provider !== null &&
        userAddress !== ADDRESS0 &&
        supplyBorrowed !== null &&
        supplyBorrowShares !== null
    ) {
      setModal2(true);
    }
  }

  const signer = provider == null ? null : provider.getSigner();

  let CMM = signer == null ? null : new ethers.Contract(process.env.REACT_APP_CMM_ADDRESS, ICoreMoneyMarketABI, signer);
  let DAI = signer == null ? null : new ethers.Contract(process.env.REACT_APP_BASE_ASSET_ADDRESS, IERC20ABI, signer);
  let CASSET = signer == null ? null : new ethers.Contract(process.env.REACT_APP_COLLATERAL_ADDRESS, IERC20ABI, signer);
  let BaseAgg = signer == null ? null : new ethers.Contract(process.env.REACT_APP_BASE_ASSET_AGGREGATOR_ADDRESS, IChainlinkAggregatorABI, signer);
  let CollateralAgg = signer == null ? null : new ethers.Contract(process.env.REACT_APP_COLLATERAL_AGGREGATOR_ADDRESS, IChainlinkAggregatorABI, signer);

  useEffect(() => {
    let asyncUseEffect = async () => {
      if (provider !== null) {
        if (annualLendRate === '0') {
          CMM.getPrevSILOR().then(silor => {
            let annualized = getAnnualizedRate(silor);
            let pct = annualized.sub(TOTAL_SBPS);
            let rateString = getDecimalString(pct.toString(), 16, 3);
            setAnnualLendRate(rateString);
          });
        }
        if (annualBorrowRate === '0') {
          CMM.getPrevSIBOR().then(sibor => {
            let annualized = getAnnualizedRate(sibor);
            let pct = annualized.sub(TOTAL_SBPS);
            let rateString = getDecimalString(pct.toString(), 16, 3);
            setAnnualBorrowRate(rateString);
          });
        }
        if (
            userVaults === null &&
            baseAggAnswer !== null &&
            baseAggDecimals !== null &&
            collateralAggAnswer !== null &&
            collateralAggDecimals !== null &&
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
        if (collateralAggAnswer == null) {
          CollateralAgg.latestAnswer().then(res => setCollateralAggAnswer(res));
        }
        if (collateralAggDecimals == null) {
          CollateralAgg.decimals().then(res => setCollateralAggDecimals(res));
        }
      }
    };
    asyncUseEffect();
  });

  const vaultComponents = ([userVaults, supplyBorrowed, supplyBorrowShares].includes(null) ? [] : userVaults)
    .map(vault => {
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
          <h4>DAI / wETH</h4>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_position_box">
              <h5>Total debt</h5>
              <h2><img src={debt_icon} alt="img" className="debt_icon"/> {borrowString} DAI</h2>
              <p>~ $ {borrowUSDString}</p>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_position_box">
              <h5>Collateral Value</h5>
              <h2><img src={collateral_value} alt=""/> {collateralString} wETH</h2>
              <p>~ $ {collateralUSDString}</p>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_position_box">
              <h5>Collateralization ratio <span><img src={ratio_question} alt=""/></span></h5>
              <h2>{collateralizationRatioString}%</h2>
              <p>{process.env.REACT_APP_COLLATERALIZATION_FACTOR}% min. collateralization ratio</p>
            </div>
          </div>
          <div className="col-lg-12 col-md-12">
            <div className="borrow_position_box total_debt_box">
              <h5>Total debt</h5>
            </div>
          </div>
          <div className="col-lg-12 col-md-12">
            <div className="borrow_position_box total_debt_box">
              <button onClick={clickManagePositionFactory(vault)}><h5>Manage position</h5></button>
            </div>
          </div>
        </div>
      );
    });
  const borrowMessage = vaultComponents.length > 0 ? 'Your Borrow Positions' : 'No Borrow Positions';

  return (
    <div>
      <section className="borrow_section">
        <div className="container">
        <div className="row">
          <div className="col-lg-4 col-md-4">
            <div className="borrow_box">
              <h5>Lend Rate</h5>
              <div className="borrow_box_text">
                <h2>{annualLendRate} %</h2>
                <p>Lend Variable APY</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_box">
              <h5>Borrow Rate</h5>
              <div className="borrow_box_text">
                <h2>{annualBorrowRate} %</h2>
                <p>Borrow Variable APR</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <div className="borrow_box_add">
              <div className="plus_added"
                onClick={() => handleShow2()}
              >
                <button>+</button>
                <p>open Borrowing positions</p>
              </div>
            </div>
          </div>
        </div>
        </div>
        
      </section>

      <section>
        <div className="row borrow_position">
            <div className="borrow_stablecoins">
              <h5>Borrow DAI against wETH at {annualBorrowRate}% annually</h5>
              <ul>
                <li><img src={debt_icon} alt=""/></li>
                <li><img src={collateral_value} alt=""/></li>
                <li><img src={t_icon} alt=""/></li>
                <li><button>+</button></li>
              </ul>
            </div>
        </div>
      </section>

      <section>
        <div className="row borrow_position">
            <h4>{borrowMessage}</h4>
            {vaultComponents}
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
            provider={provider}
            userAddress={userAddress}
            CMM={CMM}
            DAI={DAI}
            CASSET={CASSET}
            vault={selectedVault}
            supplyBorrowed={supplyBorrowed}
            supplyBorrowShares={supplyBorrowShares}
            forceUpdateVault={forceUpdateVault}
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
            provider={provider}
            userAddress={userAddress}
            CMM={CMM}
            DAI={DAI}
            CASSET={CASSET}
            userVaults={userVaults}
            supplyBorrowed={supplyBorrowed}
            supplyBorrowShares={supplyBorrowShares}
            baseAggAnswer={baseAggAnswer}
            baseAggDecimals={baseAggDecimals}
            collateralAggAnswer={collateralAggAnswer}
            collateralAggDecimals={collateralAggDecimals}
          />
        </Modal>

       
    </div>
  )
}

export default Index;
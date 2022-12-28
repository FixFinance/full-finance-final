import React, { useState, useContext, useEffect } from "react";
import "./borrow.scss";
import dai from "../../assets/image/dai.svg";
import weth from "../../assets/image/weth.svg";
import wstETH from "../../assets/image/lidosteth.png";
import { LOGO_MAP } from '../../Utils/LogoMap';
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
import { getAssetInfoFromVault } from '../../Utils/EthersStateProcessing';
import { ADDRESS0, TOTAL_SBPS, _0, COLLATERAL_ADDRESSES, COLLATERAL_SYMBOLS, COLLATERAL_AGGREGATOR_ADDRESSES, COLLATERAL_AGGREGATOR_ADDRESSES_LCASE } from '../../Utils/Consts.js';
import Header from "../../ShareModules/Layout/Header/Header";

const ENV_TICKERS = JSON.parse(process.env.REACT_APP_TICKERS);

function Index() {
  const [modal1, setModal1] = useState(false);
  const [modal2, setModal2] = useState(false);
  const [modal3, setModal3] = useState(false);

  const [selectedAssetEnvIndex, setSelectedAssetEnvIndex] = useState(null);

  const [getWalletInfo, getBasicInfo, updateBasicInfo] = useContext(EthersContext);
  const BasicInfo = getBasicInfo();
  const {
    vault,
    irmInfo,
    aggInfo
  } = BasicInfo;
  const annualLendRateString = '0';
  const annualBorrowRateString = '0';
  const supplyLentBN = _0;
  const supplyBorrowedBN = _0;

  const [provider, userAddress] = getWalletInfo();
  const signer = provider == null ? null : provider.getSigner();

  const closeManagePosition = () => {
    setModal1(false);
  }
  const clickManagePositionFactory = (assetEnvIndex) => {
    const clickManagePosition = () => {
      setSelectedAssetEnvIndex(assetEnvIndex);
      setModal1(true);
    }
    return clickManagePosition;
  };
  const handleClose2 = () => {
    setModal2(false);
  }

  const handleShow2 = () => {
    if (![signer, vault, irmInfo, aggInfo].includes(null)) {
      setModal2(true);
    }
  }

  const handleClose3 = () => {
    setModal3(false);
  }
  const handleShow3 = () => setModal3(true);

  const listedAssetComponents = [irmInfo, aggInfo, vault].includes(null) ? [] : irmInfo.map((x, i) => {
    let TICKER = ENV_TICKERS[i];
    let {
      isSupplied, suppliedUnderlyingString, suppliedUnderlyingUSDValueString,
      isBorrowed, borrowedUnderlyingString, borrowedUnderlyingUSDValueString
    } = getAssetInfoFromVault(vault, irmInfo, aggInfo, i);
    return (
      <div className="row borrow_position_wrap">
        <h4>{TICKER}</h4>
        <div className="col-lg-4 col-md-4">
          <div className="borrow_position_box">
            <h5>Supplied</h5>
            <h2><img src={LOGO_MAP[TICKER]} alt={TICKER + ' image'} className="vault_icon"/> {suppliedUnderlyingString} {TICKER}</h2>
            <p>~ $ {suppliedUnderlyingUSDValueString}</p>
          </div>
        </div>
        <div className="col-lg-4 col-md-4">
          <div className="borrow_position_box">
            <h5>Borrowed</h5>
            <h2><img src={LOGO_MAP[TICKER]} alt={TICKER + ' image'} className="vault_icon"/> {borrowedUnderlyingString} {TICKER}</h2>
            <p>~ $ {borrowedUnderlyingUSDValueString}</p>
          </div>
        </div>
        <div className="col-lg-4 col-md-4">
          <div className="borrow_position_box">
            <h5>Lend APY</h5>
            <h2>{irmInfo[i].annualLendRateString}%</h2>
            <p>{irmInfo[i].annualBorrowRateString}% Borrow APR</p>
          </div>
        </div>
        <div className="mx-auto">
          <div onClick={clickManagePositionFactory(i)} className="borrow_position_box total_debt_box">
            <button><h5>Manage position</h5></button>
          </div>
        </div>
      </div>
    );
  });
  const bannerMessage = 'Collateral & Borrow Positions';

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
              <h4 className="vault-header">{bannerMessage}</h4>
                {listedAssetComponents}
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
            vault={vault}
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
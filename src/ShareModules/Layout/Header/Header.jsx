import React, { useEffect, useState, useContext } from "react";
import "./Header.scss";
import { Link, NavLink } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Modal from "react-bootstrap/Modal";

import ConnectModal from "../../../Components/ConnectWallet/ConnectModal";
import AccountModal2 from "../../../Components/AccountModals/AccountModal2";
import WrongNetworkModal from "../../../Components/ConnectWallet/WrongNetworkModal";
import ellipse_icon from "../../../assets/image/ellipse2.svg";
import { EthersContext } from '../../../Components/EthersProvider/EthersProvider';
import { LoginContext } from "../../../helper/userContext";
import { ADDRESS0 } from '../../../Utils/Consts.js';
import Moralis from "moralis";
import { useMoralis, useMoralisWeb3Api } from "react-moralis";


const Header = ({ z }) => {

  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);

  const handleClose = () => {
    setShow(false);
  }
  const handleShow = () => setShow(true);

  const handleClose2 = () => {
    setShow2(false);
  }
  const handleShow2 = () => {
    setShow2(true);
  }

  const handleClose3 = () => {
    setShow3(false);
  }
  const handleShow3 = () => setShow3(true);

  const [getWalletInfo, , , provider_disconnect] = useContext(EthersContext);
  const [, userAddress, userETH, userENS, userAvatar, chainId, walletType] = getWalletInfo();

  const disconnect = () => {
    provider_disconnect();
    handleClose2();
  }

  const loggedIn = walletType !== 'basic';

  const abbreviatedAddress = userAddress.substring(0, 6)+'...'+userAddress.substring(userAddress.length-4);
  const menuAbbreviatedAddress = userAddress.substring(0, 11)+'...'+userAddress.substring(userAddress.length-4);

  return (
    <>
    <div class="header-container position-relative mx-auto">
      <div className={z ? "header2 " : "header"}>
      <div className={show3 ? "header-top-overlay" : "header-top"}>
        <Navbar
          expand="md"
          collapseOnSelect
          // expanded={expanded}
          // onToggle={expanded}
          className="navbar navbar-expand-lg navbar-dark home-nav"
        >
          <div className="container">
          <Navbar.Toggle aria-controls="basic-navbar-nav" onClick={() => setShow3(!show3)}/>
            <div className={userAddress !== ADDRESS0 ? "connected-navbar-brand" : "navbar-brand"} to="/">
              <img src="assets/images/logo.svg" alt="" />
            </div>
            <Navbar.Collapse id="basic-navbar-nav">
              <ul className={show3 ? "navbar-nav overlay-nav" : "navbar-nav mx-auto mb-2 mt-lg-3 justify-content-around"}>
                <li>
                  <NavLink
                    to="/"
                    activeClassName={show3 ? "" : "active"}
                    // onClick={() => {
                    //   setXData("");
                    // }}
                  >
                    Home
                  </NavLink>{" "}
                </li>
                <li>
                  <NavLink
                    to="/lend"
                    activeClassName={show3 ? "" : "active"}
                  //   onClick={() => {
                  //     setXData("/lend");
                  //   }}
                  >
                    Lend
                  </NavLink>{" "}
                </li>
                <li>
                  <NavLink
                    to="/borrow"
                    activeClassName={show3 ? "" : "active"}
                    // onClick={() => {
                    //   setXData("/borrow");
                    // }}
                  >
                    Borrow{" "}
                  </NavLink>
                </li>
                {show3 === true ? (
                <>
                  <li>
                    <NavLink
                      to="/socials"
                      activeClassName="none"
                    >
                      Discord{" "}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/socials"
                      activeClassName="none"
                    >
                      Twitter{" "}
                    </NavLink>
                  </li>
                </>
                ) : (
                  <li className="align-middle">
                      <div>...</div>
                  </li>
                )}
              </ul>
            </Navbar.Collapse>
            <div className={show3 ? "text-center mx-auto w-100 button-overlay-container" : "right-side-container text-center"}>
                {loggedIn ? (
                  <>
                  {show3 === true ? (
                    <>
                      <div className="row g-3 mt-1">
                        <div className="col-2">
                          <img className={userAvatar ? "avatar_img_overlay" : "ellip_img_overlay"} src={userAvatar ? userAvatar : ellipse_icon} alt="img" />
                        </div>
                        <div className="col-9">
                          <p className="address">{menuAbbreviatedAddress}</p>
                        </div>
                      </div>
                      <button className={"btn overlay-button"} onClick={handleShow} style={{ background: "#EDF0EB", color: "#252727", "margin-top": "20px" }}>
                        Disconnect Wallet
                      </button>
                    </>
                  ) : (
                    <div className="d-flex justify-content-center mt-lg-2 mt-3" onClick={handleShow2}>
                      <button className="btn eth_btn pt-1">{userETH} ETH</button>
                      <button className="btn num_btn d-flex">
                        <img
                          src={userAvatar ? userAvatar : ellipse_icon}
                          alt="img"
                          className={userAvatar ? "avatar_img align-self-center" : "ellip_img align-self-center"}
                        />
                        <div className="pt-1" style={{ "font-family": "Nib Pro SemiBold", }}>{abbreviatedAddress}</div>
                      </button>
                  </div>
                  )}
                </>
                ) : (
                  <div className={show3 ? "" : "button-container"}>
                    <button className={show3 ? "btn overlay-button" : "btn connect-wallet"} onClick={handleShow}>
                      Connect Wallet
                    </button>
                  </div>
                )}
              </div>
          </div>
        </Navbar>
        {/* ************ connect wallet pop up ***************/}
        <Modal
          show={show}
          onHide={handleClose}
          centered
          animation={false}
          className="connect-wallet-modal"
        >
          <ConnectModal handleClose={handleClose}/>
        </Modal>
        {/* ************ account logout pop up 2 ***************/}
        <Modal
          show={show2}
          onHide={handleClose2}
          centered
          animation={false}
          className=""
        >
          <AccountModal2 handleClose={handleClose2} userAddress={userAddress} ens={userENS} avatar={userAvatar} disconnect={disconnect}/>
        </Modal>
        {/* ************ wrong network modal ***************/}
        <Modal
          show={show3}
          onHide={handleClose3}
          centered
          animation={false}
          className=""
        >
          <WrongNetworkModal handleClose={handleClose3} />
        </Modal>
        </div>
        </div>
    </div>
  </>
  );
};

export default Header;

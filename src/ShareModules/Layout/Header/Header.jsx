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
import { ADDRESS0 } from '../../../Utils/Consts.js';

const Header = ({ z }) => {
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);

  const handleClose = () => {
    setShow(false);
    // setXData('/');
  }
  const handleShow = () => setShow(true);
  const handleClose2 = () => {
    setShow2(false);
    // setXData('/');
  }
  const handleShow2 = () => setShow2(true);
  const [zData, setZData] = useState(z);
  const [getWalletInfo] = useContext(EthersContext);
  const [provider, userAddress, userETH, userENS, chainId, walletType] = getWalletInfo();

  const abbreviatedAddress = userAddress.substring(0, 6)+'...'+userAddress.substring(userAddress.length-4);

  // let y = ["/lend", "/borrow"];
  // let currentPath = window.location.pathname.split('/');
  // let endLocation = currentPath.length > 0 ? '/'+currentPath[currentPath.length-1] : '/';
  // const [xData, setXData] = useState(endLocation);
  // let z = y.includes(xData);
  useEffect(() => {
    setZData(z);
  }, [z]);

  return (
    <>
    <div class="header-container position-relative mx-auto">
      <div className={zData ? "header2 header-top" : "header header-top"}>
        <Navbar
          expand="md"
          collapseOnSelect
          // expanded={expanded}
          // onToggle={expanded}
          className="navbar navbar-expand-lg navbar-dark home-nav"
        >
          <div className="container">
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <div className="navbar-brand" to="/">
              <img src="assets/images/logo.svg" alt="" />
            </div>
            <Navbar.Collapse id="basic-navbar-nav">
              <ul className="navbar-nav mx-auto mb-2 mb-lg-0 justify-content-around">
                <li>
                  <NavLink
                    to="/"
                    activeClassName="active"
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
                    activeClassName="active"
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
                    activeClassName="active"
                    // onClick={() => {
                    //   setXData("/borrow");
                    // }}
                  >
                    Borrow{" "}
                  </NavLink>
                </li>
              </ul>
            </Navbar.Collapse>
            <div className="right-side-container text-center">
                {userAddress !== ADDRESS0 ? (
                  <div className="d-flex justify-content-center mt-lg-0 mt-3" onClick={() => handleShow2()}>
                    <button className="btn eth_btn">{userETH} ETH</button>
                    <button className="btn num_btn d-flex">
                      <img
                        src={ellipse_icon}
                        alt="img"
                        className="ellip_img align-self-center"
                      />
                      <div>{abbreviatedAddress}</div>
                    </button>
                  </div>
                ) : (
                  <div className="button-container">
                    <button className="btn connect-wallet" onClick={handleShow}>
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
          className="connect-wallet-modal"
        >
          <AccountModal2 handleClose={handleClose2} />
        </Modal>
      </div>
    </div>
  </>
  );
};

export default Header;

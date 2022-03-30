import React, { useEffect, useState } from "react";
import "./Header.scss";
import { Link, NavLink } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Modal from "react-bootstrap/Modal";

import ConnectModal from "../../../Components/ConnectWallet/ConnectModal";
import AccountModal2 from "../../../Components/AccountModals/AccountModal2";
import ellips_icon from "../../../assets/image/ellips2.svg";
const Header = () => {
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);

  const handleClose = () => setShow(false);
  const handleClose2 = () => setShow2(false);
  const handleShow = () => setShow(true);
  const handleShow2 = () => setShow2(true);
  const [zData, setZData] = useState("");

  let y = ["/lend", "/borrow"];
  const [xData, setXData] = useState(); // Hardcoded logic for logged in user
  // let x = window.location.pathname;
  console.log(xData);
  let z = y.includes(xData);
  useEffect(() => {
    setZData(z);
  }, [z]);

  return (
    <>
      <div className={zData ? "header2 header-top" : "header header-top"}>
        <Navbar
          expand="lg"
          collapseOnSelect
          // expanded={expanded}
          // onToggle={expanded}
          className="navbar navbar-expand-lg navbar-dark home-nav"
        >
          <div className="container">
            <Link className="navbar-brand" to="/">
              <img src="assets/images/logo.svg" alt="" />
            </Link>

            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <ul className="navbar-nav mx-auto mb-2 mb-lg-0 justify-content-around">
                <li>
                  <NavLink
                    to="/"
                    activClassName="active"
                    onClick={() => {
                      setXData("");
                    }}
                  >
                    Home
                  </NavLink>{" "}
                </li>
                <li>
                  <NavLink
                    to="/lend"
                    activClassName="active"
                    onClick={() => {
                      setXData("/lend");
                    }}
                  >
                    Lend
                  </NavLink>{" "}
                </li>
                <li>
                  <NavLink
                    to="/borrow"
                    activClassName="active"
                    onClick={() => {
                      setXData("/borrow");
                    }}
                  >
                    Borrow{" "}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="" activClassName="active">
                    ...{" "}
                  </NavLink>
                </li>
              </ul>
              <div className="d-lg-flex text-center  ">
                {y.includes(xData) ? (
                  <div className="d-flex justify-content-center mt-lg-0 mt-3" onClick={() => handleShow2()}>
                    <button className="btn eth_btn">5.12345 ETH</button>
                    <button className="btn num_btn d-flex">
                      <img
                        src={ellips_icon}
                        alt="img"
                        className="ellip_img align-self-center"
                      />
                      <div>0x1234...1234</div>
                    </button>
                  </div>
                ) : (
                  <Link className="" to="">
                    <button className="btn connect-wallet" onClick={handleShow}>
                      Connect Wallet
                    </button>
                  </Link>
                )}
              </div>
            </Navbar.Collapse>
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
          <ConnectModal handleClose={handleClose} />
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
    </>
  );
};

export default Header;

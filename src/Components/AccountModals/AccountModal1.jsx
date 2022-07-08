import React, { useState, useContext } from "react";
import Modal from "react-bootstrap/Modal";
import ellipse1 from "../../assets/image/ellipse1.svg";
import { EthersContext } from "../EthersProvider/EthersProvider";
import Moralis from "moralis"
import "./accountmodal.scss";
const AccountModal1 = ({ handleClose, address }) => {
  let abbreviatedAddress = address.substring(0, 9)+'...'+address.substring(address.length-4);

  const [getWalletInfo, setWrongChainState] = useContext(EthersContext);

  async function logout () {
    try {
        await Moralis.User.logOut();
        handleClose();
    } catch (err) {
        console.log(err)
    }
}


  return (
    <div className="connect-modal account-modal">
      <Modal.Header closeButton>
        <h5>Your wallet</h5>
      </Modal.Header>
      <Modal.Body>
        <img src={ellipse1} alt="img" className="ellipse" />
        <h5>{abbreviatedAddress}</h5>
        <div className="mb-4 mt-5">
          <div className="text-center">
            <button
              className="btn common_btn cancel"
              onClick={() => navigator.clipboard.writeText(address)}
            >
              Copy address
            </button>
          </div>
          <div className="text-center">
            {" "}
            <button className="btn common_btn switch" onClick={logout}>
              Disconnect wallet
            </button>
          </div>
        </div>
      </Modal.Body>
    </div>
  );
};

export default AccountModal1;

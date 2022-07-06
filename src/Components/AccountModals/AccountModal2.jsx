import React, { useState, useContext } from "react";
import Modal from "react-bootstrap/Modal";
import ellipse2 from "../../assets/image/ellipse2.svg"
import "./accountmodal.scss";
import AccountModal1 from "./AccountModal1";
import Moralis from "moralis"
import { EthersContext } from "../EthersProvider/EthersProvider";
import { LoginContext } from "../../helper/userContext";

const AccountModal2 = ({ handleClose, address, ens, avatar }) => {
  const [modalType, setModalType] = useState("basicColor");

  let abbreviatedAddress = address.substring(0, 10)+'...'+address.substring(address.length-9);

  const {loggedIn, setLoggedIn} = useContext(LoginContext);


  async function logout () {
    try {
        await Moralis.User.logOut();
        setLoggedIn(false);
        handleClose();
    } catch (err) {
        console.log(err)
    }
}

  return (
    <div>
      <div className="connect-modal account-modal">
        {modalType === "basicColor" && (
          <>
            <Modal.Header closeButton>
              <h5>Your wallet</h5>
            </Modal.Header>
            <Modal.Body>
              <img src={avatar ? avatar : ellipse2} alt="img" className={avatar ? "avatar" : "ellipse"} />
              {ens !== null &&
                <>
                  <h5>{ens}</h5>
                  <h6>{abbreviatedAddress}</h6>
                </>
              }
              {ens === null && <h5>{abbreviatedAddress}</h5>}

              <div className="mb-4 mt-5">
                <div className="text-center">
                  <button
                    onClick={() => {
                      setModalType("DhikaChikaColor");
                      navigator.clipboard.writeText(address);
                    }}
                    className="btn common_btn cancel"
                  >
                    Copy address
                  </button>
                </div>
                <div className="text-center">
                  {" "}
                  <button
                    className="btn common_btn switch"
                    onClick={logout}
                  >
                    Disconnect wallet
                  </button>
                </div>
              </div>
            </Modal.Body>
          </>
        )}
        {modalType === "DhikaChikaColor" && (
          <>
            <AccountModal1 address={address}/>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountModal2;

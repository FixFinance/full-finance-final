import React, { useState, useContext } from "react";
import Modal from "react-bootstrap/Modal";
import ellipse2 from "../../assets/image/ellipse2.svg"
import "./accountmodal.scss";
import AccountModal1 from "./AccountModal1";
import Moralis from "moralis"
import { EthersContext } from "../EthersProvider/EthersProvider";
import { LoginContext } from "../../helper/userContext";
import { ADDRESS0 } from "../../Utils/Consts";

const AccountModal2 = ({ handleClose, ens, avatar }) => {
  const [modalType, setModalType] = useState("basicColor");

  const {loggedIn, setLoggedIn, signer, setSigner, userAddress, setUserAddress, userETH, setUserETH, userENS, setUserENS, userAvatar, setUserAvatar} = useContext(LoginContext);

  let abbreviatedAddress = userAddress.substring(0, 10)+'...'+userAddress.substring(userAddress.length-9);

  async function logout () {
    try {
        await Moralis.User.logOut();
        setLoggedIn(false);
        setSigner(null);
        setUserAddress(ADDRESS0);
        setUserETH('0');
        setUserENS(null);
        setUserAvatar(null);
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
                      navigator.clipboard.writeText(userAddress);
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
            <AccountModal1 address={userAddress}/>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountModal2;

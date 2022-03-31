import React, { useState } from "react";
import "./Footer.scss";
import ff from "../../../assets/image/ff.png";
import parcent from "../../../assets/image/parcent.png";
import { Link } from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import AddCollateral from "../../../Components/Collateral Modals/AddCollateral";
import WithdrawCollateral from "../../../Components/Collateral Modals/WithdrawCollateral";
import Debt from "../../../Components/RepayModals/Debt";
import BorrowMore from "../../../Components/RepayModals/BorrowMore";
function Footer() {
  const [modal1, setModal1] = useState(false);

  const handleClose1 = () => setModal1(false);
  const handleShow1 = () => setModal1(true);
  const [modal2, setModal2] = useState(false);

  const handleClose2 = () => setModal2(false);
  const handleShow2 = () => setModal2(true);
  const [modal3, setModal3] = useState(false);

  const handleClose3 = () => setModal3(false);
  const handleShow3 = () => setModal3(true);
  const [modal4, setModal4] = useState(false);

  const handleClose4 = () => setModal4(false);
  const handleShow4 = () => setModal4(true);
  return (
    <>
      <div className="footer marginclass">
        <div>
          <Link to="/..">
            <img src={ff} alt="img" className="f_img" />
          </Link>
          <ul>
            <li>
              <Link to="/..">Terms</Link>
            </li>
            <li>
              <Link to="/..">Privacy</Link>
            </li>
            <li>
              <Link to="/..">Cookies</Link>
            </li>
          </ul>
        </div>
        <img src={parcent} alt="img" className="parcent_img" />
      </div>

      <Modal
        show={modal1}
        onHide={handleClose1}
        centered
        animation={false}
        className="deposit-modal"
      >
        <AddCollateral handleClose={handleClose1} />
      </Modal>
      <Modal
        show={modal2}
        onHide={handleClose2}
        centered
        animation={false}
        className="deposit-modal"
      >
        <WithdrawCollateral handleClose={handleClose2} />
      </Modal>
      <Modal
        show={modal3}
        onHide={handleClose3}
        centered
        animation={false}
        className="deposit-modal"
      >
        <Debt handleClose={handleClose3} />
      </Modal>
      <Modal
        show={modal4}
        onHide={handleClose4}
        centered
        animation={false}
        className="deposit-modal"
      >
        <BorrowMore handleClose={handleClose4} />
      </Modal>
    </>
  );
}

export default Footer;

import React, { useState, useEffect, useContext } from 'react';
import Card from "react-bootstrap/Card";
import Button  from 'react-bootstrap/Button';
import Modal from "react-bootstrap/Modal";
import AccountModal1 from '../../AccountModals/AccountModal1';
import AccountModal2 from '../../AccountModals/AccountModal2';
import { Link } from 'react-router-dom';
import { ethers, BigNumber as BN } from 'ethers';
import { EthersContext } from '../../EthersProvider/EthersProvider';
import { getDecimalString } from '../../../Utils/StringAlteration';
import { getAnnualizedRate } from '../../../Utils/RateMath';
import { ADDRESS0, TOTAL_SBPS, _0 } from '../../../Utils/Consts.js';

const ICoreMoneyMarketABI = require('../../../abi/ICoreMoneyMarket.json');
const IERC20ABI = require('../../../abi/IERC20.json');
const IChainlinkAggregatorABI = require('../../../abi/IChainlinkAggregator.json');

const Deposit=()=> {

  const [show, setShow] = useState(false);

  const [getWalletInfo] = useContext(EthersContext);
  const [provider, userAddress] = getWalletInfo();

  const [annualLendRate, setAnnualLendRate] = useState('0');
  const [annualBorrowRate, setAnnualBorrowRate] = useState('0');
  const [valueLentString, setValueLentString] = useState('0');
  const [valueBorrowedString, setValueBorrowedString] = useState('0');

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const signer = provider == null ? null : provider.getSigner();
  let CMM = signer == null ? null : new ethers.Contract(process.env.REACT_APP_CMM_ADDRESS, ICoreMoneyMarketABI, signer);
  let BaseAgg = signer == null ? null : new ethers.Contract(process.env.REACT_APP_BASE_ASSET_AGGREGATOR_ADDRESS, IChainlinkAggregatorABI, signer);

  useEffect(() => {
    BaseAgg.latestAnswer().then(answer => {
      CMM.getSupplyLent().then(supplyLent => {
        let valueBN = answer.mul(supplyLent).div(TOTAL_SBPS);
        setValueLentString(getDecimalString(valueBN.toString(), 18, 0));
      });
      CMM.getSupplyBorrowed().then(supplyBorrowed => {
        let valueBN = answer.mul(supplyBorrowed).div(TOTAL_SBPS);
        setValueBorrowedString(getDecimalString(valueBN.toString(), 18, 0));
      });
    });

    CMM.getPrevSILOR().then(silor => {
      let annualized = getAnnualizedRate(silor);
      let pct = annualized.sub(TOTAL_SBPS);
      let rateString = getDecimalString(pct.toString(), 16, 3);
      setAnnualLendRate(rateString);
    });

    CMM.getPrevSIBOR().then(sibor => {
      let annualized = getAnnualizedRate(sibor);
      let pct = annualized.sub(TOTAL_SBPS);
      let rateString = getDecimalString(pct.toString(), 16, 3);
      setAnnualBorrowRate(rateString);
    });

  }, []);

  const loop = [
      {
        
          title:"Total Deposits",
          price:valueLentString,
          ButtonText:"Lend Now",
          CurrentDeposit:"Current Deposit Rate",
          price1:annualLendRate+"%",
          link: "/lend",
      },
      {
          title:"Total Borrowed",
          price:valueBorrowedString,
          ButtonText:"Borrow Now",
          CurrentDeposit:"Current Deposit Rate",
          price1:annualBorrowRate+"%",
          link: "/borrow"
      }
  ]

  return (
    <div className='deposit_section'>
    <div className='container deposit'>
        <div className='row'>


        {loop.map((item,index)=>{
            return(
                <div className='col-sm-6 m-auto mt-sm-0 mt-3'>
                <Card key={index} className="bg-dark text-center">
                {/* <Card.Img variant="top" src={item.img} /> */}
                <Card.Body>
                  <Card.Title >{item.title}</Card.Title>
                  <Card.Text>
            <h3 className='mt-4'>${item.price}</h3>

                  </Card.Text>
                  <Link to={item.link}>
                    <button  className='button-text-one' onClick={item.click}>{item.ButtonText}</button>
                  </Link>
                  <Card.Text className='p1'>
                    {item.CurrentDeposit}
                  </Card.Text>
                  <Card.Text className='item-price-one'>
                    {item.price1}
                  </Card.Text>
                </Card.Body>
              </Card>
              </div>
            )
        })}
       </div>
    {/* *************** account pop up 1 ************** */}
    <Modal
          show={show}
          onHide={handleClose}
          centered
          animation={false}
          className="connect-wallet-modal"
        >
          <AccountModal1 handleClose={handleClose} />
        </Modal>
        {/* *************** account pop up 1 ************** */}
        {/* *************** account pop up 2 ************** */}
        {/* <Modal
          show={show}
          onHide={handleClose}
          centered
          animation={false}
          className="connect-wallet-modal"
        >
          <AccountModal2 handleClose={handleClose} />
        </Modal> */}
          {/* *************** account pop up 2 ************** */}
    </div>
    </div>
  )
}

export default Deposit;
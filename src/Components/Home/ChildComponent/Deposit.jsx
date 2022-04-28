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

  const [getWalletInfo, getBasicInfo, updateBasicInfo] = useContext(EthersContext);
  const [provider, userAddress] = getWalletInfo();
  const {
    annualLendRateString,
    annualBorrowRateString,
    valueLentString,
    valueBorrowedString
  } = getBasicInfo();

  if (
    annualLendRateString === '0' &&
    annualBorrowRateString === '0' &&
    valueLentString === '0' &&
    valueBorrowedString === '0'
  ) {
    updateBasicInfo();
  }

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const loop = [
      {
        
          title:"Total Deposits",
          price:valueLentString,
          ButtonText:"Lend Now",
          CurrentDeposit:"Current Deposit Rate",
          price1:annualLendRateString+"%",
          link: "/lend",
      },
      {
          title:"Total Borrowed",
          price:valueBorrowedString,
          ButtonText:"Borrow Now",
          CurrentDeposit:"Current Deposit Rate",
          price1:annualBorrowRateString+"%",
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
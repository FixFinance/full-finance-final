import React, { useState } from 'react';
import Card from "react-bootstrap/Card";
import Button  from 'react-bootstrap/Button';
import Modal from "react-bootstrap/Modal";
import AccountModal1 from '../../AccountModals/AccountModal1';
import AccountModal2 from '../../AccountModals/AccountModal2';
import './home.scss';
import { Link } from 'react-router-dom';
const Deposit=()=> {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
    const loop=[
        {
          
            title:"Total Deposits",
            price:"672.12B",
            ButtonText:"Lend Now",
            CurrentDeposit:"Current Deposit Rate",
            price1:"12.10%",
            link: "/lend",
        },
        {
            title:"Total Borrowed",
            price:"32.98B",
            ButtonText:"Borrow Now",
            CurrentDeposit:"Current Deposit Rate",
            price1:"12.10%",
            link: "/borrow"
        }
    ]
  return (
    <>
      <div className='section-container mx-auto'>
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
      </div>
    </>
  )
}

export default Deposit;
import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { Accordion } from "react-bootstrap";

const GetStartedCon = () => {
  const loop = [
    {
      key_no: "0",
      heading: "What assets can be used as collateral?",
      description:
        "Because NFT chose some centralised consensus process behind few dump, Zilliqa cut off lots of moon in a unspent transaction output. Basic Attention Token thinking a consensus process for a proof of stake.",
    },
    {
      key_no: "1",
      heading: "What is fixed rate?",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmoLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmoLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmo",
    },
    {
      key_no: "2",
      heading: "Will I be charged fees?",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmoLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmoLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmo",
    },
    {
      key_no: "3",
      heading: "When do I need to repay borrowed assets?",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmoLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmoLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmo",
    },
    {
      key_no: "4",
      heading: "How can I withdraw collateral?",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmoLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmoLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmo",
    },
    {
      key_no: "5",
      heading: "How can I withdraw collateral?",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmoLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmoLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmo",
    },
  ];
  return (
    <div className="section-container mx-auto">
      <div className="container accordion">
        <div className="main-con px-3">
          <Accordion defaultActiveKey="0">
            {loop.map((item, index) => {
              return (
                <Accordion.Item
                  eventKey={item.key_no}
                  className={`bg-transparent ${item.key_no==="5"?"border_none":"none"} `}
                  key={index}
                >
                  <Accordion.Header className="bg-transparent">
                    {item?.heading}
                  </Accordion.Header>
                  <Accordion.Body>{item?.description}</Accordion.Body>
                </Accordion.Item>
              );
            })}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default GetStartedCon;

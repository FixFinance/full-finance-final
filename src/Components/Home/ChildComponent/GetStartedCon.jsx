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
        "STETH and WETH are currently the only assets supported as collateral though more may be added in the future",
    },
    {
      key_no: "1",
      heading: "What happens if I am liquidated?",
      description:
        "If you are liquidated your debt obligation will disappear from your borrow position along with a chunk of your collateral",
    },
    {
      key_no: "2",
      heading: "Will I be charged fees?",
      description:
        "A small percentage of interest paid by borrowers may be collected by the protocol the rest is distributed evenly amongst all lenders. All fees are accounted for in the rates presented on this website.",
    },
    {
      key_no: "3",
      heading: "When do I need to repay borrowed assets?",
      description:
        "You can repay whenever you see fit though you must be cognizant of the potential for liquidations if you let your collateralization ratio dip too low",
    },
    {
      key_no: "4",
      heading: "How can manage an existing borrow position?",
      description:
        "Management functionality of borrow positions can be accessed via the manage posiiton button found on vaults in the borrow section",
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

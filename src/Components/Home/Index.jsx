import React from "react";
import Footer from "../../ShareModules/Layout/Footer/Footer";
import Header from "../../ShareModules/Layout/Header/Header";
import Banner from "./ChildComponent/Banner";
import Deposit from "./ChildComponent/Deposit";
import GetStarted from "./ChildComponent/GetStarted";
import GetStartedCon from "./ChildComponent/GetStartedCon";

// import JoinCommunity from "./ChildComponent/JoinCommunity";

import "./Index.scss";
function Index() {
  return (
    <>
      <div className="aa ">
        <Header setZData={false}/>
       <section>
         <Banner/>
       </section>
       <section>
         <Deposit/>
       </section>
       <section>
         <GetStarted/>
       </section>
       <section>
         <GetStartedCon/>
       </section>
        {/* <section>
         <JoinCommunity/>
       </section> */}
       <Footer />
      </div>
    </>
  );
}

export default Index;

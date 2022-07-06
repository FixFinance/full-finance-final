import logo from "./logo.svg";
import "./App.scss";
import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import Index from "./Components/Home/Index";
import Lend from "./Components/Lend/Index";
import Borrow from "./Components/Borrow/Index";
import PrivateOutlet from "./ShareModules/RouterWraper/PrivateOutlet";
import EthersProvider from "./Components/EthersProvider/EthersProvider";
import { LoginContext } from "./helper/userContext";
import { ADDRESS0 } from "./Utils/Consts";

function App() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [signer, setSigner] = useState(null);
  const [userAddress, setUserAddress] = useState(ADDRESS0);
  const [userETH, setUserETH] = useState('0');
  const [userENS, setUserENS] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);

  return (
    <>
      <LoginContext.Provider value = {{ loggedIn, setLoggedIn, signer, setSigner, userAddress, setUserAddress, userETH, setUserETH, userENS, setUserENS, userAvatar, setUserAvatar }}>
      <EthersProvider>
        <Routes>
          {/**************  Start public Route *********************/}
          <Route path="/" exact element={<Index />} />
          <Route path="/lend" element={<Lend />} />
          <Route path="/borrow" element={<Borrow />} />

          {/***************  End public Route  **********************/}

          {/**************** Start Private Route *********************/}
          {/* <Route path="/*" element={<PrivateOutlet />}>
                <Route path="demo" element={<Demo />} />
              </Route> */}
          {/****************** End Private Route  *********************/}
        </Routes>
      </EthersProvider>
      </LoginContext.Provider>
    </>
  );
}

export default App;

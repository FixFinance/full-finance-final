import logo from "./logo.svg";
import "./App.scss";
import { Route, Routes } from "react-router-dom";
import Header from "./ShareModules/Layout/Header/Header";
import Footer from "./ShareModules/Layout/Footer/Footer";
import Index from "./Components/Home/Index";
import Lend from "./Components/Lend/Index";
import Borrow from "./Components/Borrow/Index";
import PrivateOutlet from "./ShareModules/RouterWraper/PrivateOutlet";
import EthersProvider from "./Components/EthersProvider/EthersProvider";

function App() {
  return (
    <>
      <EthersProvider>
        <Header />
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
    </>
  );
}

export default App;

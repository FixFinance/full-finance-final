import React from "react";
import './gradient.scss';
import { Gradient } from "./Gradient.js";
import { useEffect, useRef } from "react";

const gradient = new Gradient();

function Banner() {

  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      //gradient.initGradient("#gradient-canvas");
    }
  }, [ref]);

  return (
    <>
      <canvas id="gradient-canvas" data-transition-in></canvas>
        <div ref={ref} id="app" className="App"></div>
          <div className="layout">
            <div className="banner-text px-3">
              <h2>Optimized Rate Market</h2>
              <p>
                full finance creates a highly efficient borrow/lend experience for
                stablecoins by using reactive interest rates and a stablecoin centric
                model{" "}
              </p>
            </div>
          </div>
    </>
  );
}

export default Banner;

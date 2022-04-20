import React from "react";
import './gradient.scss';
import { Gradient } from "./Gradient.js";
import { useEffect, useRef } from "react";

const gradient = new Gradient();

function Banner() {

  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      console.log(ref);
      gradient.initGradient("#gradient-canvas");
    }
  }, [ref]);

  return (
    <>
      <canvas id="gradient-canvas" data-transition-in></canvas>
        <div ref={ref} id="app" className="App"></div>
          <div className="layout">
            <div className="banner-text px-3">
              <h2>New way of investing</h2>
              <p>
                fix finance allows both fixed rate borrowing and lending as well
                as the ability to gain leveraged exposure to variable  yield with
                the use of YTs{" "}
              </p>
            </div>
          </div>
    </>
  );
}

export default Banner;

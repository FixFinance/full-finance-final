import React from "react";
import { Link } from "react-router-dom";
import bubbleImg from "../../../assets/image/bubble.png";

const JoinCommunity = () => {
  return (
    <div className=" community marginclass text-center px-3">
      <img src={bubbleImg} alt="img" />
      <h4>Join Community</h4>
      <p>
        Join our <Link to="/..">Discord</Link> , and follow us on{" "}
        <Link to="/..">Twitter</Link> and <Link to="/..">Medium</Link> to stay
        up to date with Fix Finance.
      </p>
    </div>
  );
}

export default JoinCommunity;

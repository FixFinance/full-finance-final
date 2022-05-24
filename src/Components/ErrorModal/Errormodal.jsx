import Modal from "react-bootstrap/Modal";
import "./errormodal.scss"

const ErrorModal = ({ handleErrorClose }) => {

return (
    <div>
        <Modal.Header closeButton>
          <h5>Error</h5>
        </Modal.Header>
        <Modal.Body>
            <>
            <div className="text-center">
              <p style={{ color: "#ef767a" }}>Transaction was rejected.</p>
            </div>
              <div className="text-center">
                <button className="btn dismiss_btn" onClick={handleErrorClose}>Dismiss</button>
              </div>
            </>
        </Modal.Body>
    </div>
);

};

export default ErrorModal;
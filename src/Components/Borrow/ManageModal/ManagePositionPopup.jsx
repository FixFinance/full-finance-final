import React, { useState, useEffect } from 'react'
import Modal from "react-bootstrap/Modal";
import "./managepopup.scss";
import SuccessModal from "../../Success/SuccessModal";
import ErrorModal from '../../ErrorModal/Errormodal';
import { filterInput, getDecimalString, getAbsoluteString } from '../../../Utils/StringAlteration.js';
import { TOTAL_SBPS, _0, INF } from '../../../Utils/Consts.js';
import { ethers, BigNumber as BN } from 'ethers';
import { getNonce } from '../../../Utils/SendTx';
import { hoodEncodeABI } from '../../../Utils/HoodAbi';
import { BNmin, BNmax } from '../../../Utils/BNtools';
import dai_logo from '../../../assets/image/dai.svg';
import dropdown_button from '../../../assets/image/dropdown-button.svg';

const ManagePositionPopup = ({
    handleClose,
    provider,
    userAddress,
    CMM,
    DAI,
    CASSET,
    userVaults,
    supplyBorrowed,
    supplyBorrowShares,
    baseAggAnswer,
    baseAggDecimals,
    collateralAggAnswer,
    collateralAggDecimals,
    supplyBorrowedBN,
    supplyLentBN
}) => {

    const SUCCESS_STATUS = {
        BASE: 0,
        APPROVAL_SUCCESS: 1,
        OPEN_SUCCESS: 2,
        ERROR: 3
    }
    const [success, setSuccess] = useState(SUCCESS_STATUS.BASE);
    const [wasError, setWasError] = useState(false);
    const [waitConfirmation, setWaitConfirmation] = useState(false);
    const [sentState, setSentState] = useState(false);
    const [disabled, setDisabled] = useState(false);

    const [cInput, setCInput] = useState(null);
    const [dInput, setDInput] = useState(null);

    const [balanceCollateral, setBalanceCollateral] = useState(null);
    const [approvedCollateral, setApprovedCollateral] = useState(null);
    const [maxBorrowAmount, setMaxBorrowAmount] = useState(null);

    //Borrow-Lend Supply Difference
    const BLSdiff = supplyBorrowedBN != null && supplyLentBN != null ? supplyLentBN.sub(supplyBorrowedBN) : _0;
    const collateralBalanceString = balanceCollateral == null ? '0' : getDecimalString(balanceCollateral.toString(), parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS), 5);
    const maxBorrowString = maxBorrowAmount == null ? '0' : getDecimalString(maxBorrowAmount.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 2);

    const collateralAmountInput = cInput == null ? _0 : BN.from(getAbsoluteString(cInput, parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS)));
    const debtAmountInput = dInput == null ? _0 : BN.from(getAbsoluteString(dInput, parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS)));

    const handleClosesuccess = () => {
        if (success == SUCCESS_STATUS.APPROVAL_SUCCESS) {
            setApprovedCollateral(null);
            setSuccess(SUCCESS_STATUS.BASE);
        }
        else {
            handleClose();
        }
    }

    const handleErrorClose = () => {
        setSuccess(SUCCESS_STATUS.BASE);
        setApprovedCollateral(null);
        handleClose();
    }

    function getEffCollatRatioBN() {
        let canFind = ![balanceCollateral, baseAggAnswer, baseAggDecimals, collateralAggAnswer, collateralAggDecimals].includes(null);
        if (!canFind || (collateralAmountInput.eq(_0) && debtAmountInput.eq(_0))) {
            return _0;
        }
        if (debtAmountInput.eq(_0)) {
            return INF;
        }
        let baseAggInflator = BN.from(10).pow(baseAggDecimals);
        let baseAssetInflator = BN.from(10).pow(BN.from(process.env.REACT_APP_BASE_ASSET_DECIMALS));
        let collateralAggInflator = BN.from(10).pow(collateralAggDecimals);
        let collateralAssetInflator = BN.from(10).pow(BN.from(process.env.REACT_APP_COLLATERAL_DECIMALS));
        let collateralUSDValue = collateralAmountInput.mul(collateralAggAnswer).div(collateralAggInflator).mul(TOTAL_SBPS).div(collateralAssetInflator);
        let debtUSDValue = debtAmountInput.mul(baseAggAnswer).div(baseAggInflator).mul(TOTAL_SBPS).div(baseAssetInflator);
        let absCRatioBN = collateralUSDValue.mul(TOTAL_SBPS).div(debtUSDValue);
        return absCRatioBN;
    }

    function getEffCollatRatioString() {
        let canFind = ![balanceCollateral, baseAggAnswer, baseAggDecimals, collateralAggAnswer, collateralAggDecimals].includes(null);
        if (!canFind || (collateralAmountInput.eq(_0) && debtAmountInput.eq(_0))) {
            return '0';
        }
        if (debtAmountInput.eq(_0)) {
            return '\u221E';
        }
        let baseAggInflator = BN.from(10).pow(baseAggDecimals);
        let baseAssetInflator = BN.from(10).pow(BN.from(process.env.REACT_APP_BASE_ASSET_DECIMALS));
        let collateralAggInflator = BN.from(10).pow(collateralAggDecimals);
        let collateralAssetInflator = BN.from(10).pow(BN.from(process.env.REACT_APP_COLLATERAL_DECIMALS));
        let collateralUSDValue = collateralAmountInput.mul(collateralAggAnswer).div(collateralAggInflator).mul(TOTAL_SBPS).div(collateralAssetInflator);
        let debtUSDValue = debtAmountInput.mul(baseAggAnswer).div(baseAggInflator).mul(TOTAL_SBPS).div(baseAssetInflator);
        let absCRatioString = collateralUSDValue.mul(TOTAL_SBPS).div(debtUSDValue).toString();
        return getDecimalString(absCRatioString, 16, 2);
    }

    const MIN_SAFE_COLLAT_RATIO = BN.from(process.env.REACT_APP_COLLATERALIZATION_FACTOR).add(BN.from(5)).mul(BN.from(10).pow(BN.from(16)));
    let resultantCollatRatioSafe = getEffCollatRatioBN().gte(MIN_SAFE_COLLAT_RATIO);

    async function BroadcastTx(signer, tx) {
        console.log('Tx Initiated');
        let rec = await signer.sendTransaction(tx);
        console.log('Tx Sent', rec);
        setSentState(true);
        let resolvedRec = await rec.wait();
        console.log('Tx Resolved, resolvedRec');
        setSentState(false);
        setDisabled(false);
        return { rec, resolvedRec };
      }
    
      async function SendTx(userAddress, contractInstance, functionName, argArray, updateSentState, overrides={}) {
        if (contractInstance == null) {
          throw "SendTx2 Attempted to Accept Null Contract";
        }
      
        const signer = contractInstance.signer;
      
        let tx = {
          to: contractInstance.address,
          from: userAddress,
          data: hoodEncodeABI(contractInstance, functionName, argArray),
          nonce: await getNonce(signer.provider, userAddress),
          gasLimit: (await contractInstance.estimateGas[functionName](...argArray)).toNumber() * 2,
          ...overrides
        }
      
        let { resolvedRec } = await BroadcastTx(signer, tx, updateSentState);
      
        return resolvedRec;
      
    }

    async function approveOnClick() {
        try {
            if (CASSET !== null && CMM !== null) {
                setWaitConfirmation(true);
                await SendTx(userAddress, CASSET, 'approve', [CMM.address, INF.toString()]);
                setSuccess(SUCCESS_STATUS.APPROVAL_SUCCESS);
                setWasError(false);
                setWaitConfirmation(false);
                setBalanceCollateral(null);
                setApprovedCollateral(null);
            }
        } catch (err) {
            setSuccess(SUCCESS_STATUS.ERROR);
            setWasError(true);
            setWaitConfirmation(false);
        }
    }

    async function openVaultOnClick() {
        try {
            if (
                approvedCollateral != null && balanceCollateral != null && maxBorrowAmount != null &&
                !collateralAmountInput.eq(_0) && !debtAmountInput.eq(_0) &&
                debtAmountInput.lte(maxBorrowAmount)
            ) {
                setWaitConfirmation(true);
                setDisabled(true);
                await SendTx(userAddress, CMM, 'openCVault', [process.env.REACT_APP_COLLATERAL_ADDRESS, collateralAmountInput.toString(), debtAmountInput.toString()]);
                setSuccess(SUCCESS_STATUS.OPEN_SUCCESS);
                setWaitConfirmation(false);
            }
        } catch (err) {
            setSuccess(SUCCESS_STATUS.ERROR);
            setDisabled(false);
            setWasError(true);
            setWaitConfirmation(false);
        }
    }

    const handleCInput = (param) => {
        let value = param.target.value;
        let filteredValue = filterInput(value);
        setCInput(filteredValue);

        let collateralInBN = BN.from(getAbsoluteString(value, parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS)));
        let cFactor = BN.from(process.env.REACT_APP_COLLATERALIZATION_FACTOR);
        let canFindMaxBorrow = ![balanceCollateral, baseAggAnswer, baseAggDecimals, collateralAggAnswer, collateralAggDecimals].includes(null);
        let baseAggInflator = BN.from(10).pow(baseAggDecimals);
        let baseAssetInflator = BN.from(10).pow(BN.from(process.env.REACT_APP_BASE_ASSET_DECIMALS));
        let collateralAggInflator = BN.from(10).pow(collateralAggDecimals);
        let collateralAssetInflator = BN.from(10).pow(BN.from(process.env.REACT_APP_COLLATERAL_DECIMALS));
        let _maxBorrowAmount = collateralInBN.mul(collateralAggAnswer).mul(baseAggInflator).div(collateralAggInflator).div(baseAggInflator)
            .mul(baseAssetInflator).div(collateralAssetInflator)
            .mul(BN.from(100)).div(BN.from(cFactor).add(BN.from(5)));
        setMaxBorrowAmount(BNmin(_maxBorrowAmount, BLSdiff));
    }

    const handleDInput = (param) => {
        let value = param.target.value;
        let filteredValue = filterInput(value);
        setDInput(filteredValue);
    }

    const handleClickMax = () => {
        handleCInput({target: {value: collateralBalanceString}});
    }


    useEffect(() => {
        if (balanceCollateral == null) {
            CASSET.balanceOf(userAddress).then(res => {
                setBalanceCollateral(res);
            });
        }
        if (approvedCollateral == null) {
            CASSET.allowance(userAddress, CMM.address).then(res => {
                setApprovedCollateral(res);
            });
        }
    }, [balanceCollateral, approvedCollateral]);


    let selectCollateralAmount = (
        <div className="amount_section">
            <h5>1/3</h5>
            <h4>Enter Collateral Amount</h4>
            <div className="input_section">
                <input
                    type="text"
                    placeholder="00.00"
                    onChange={handleCInput}
                    value={cInput}
                    disabled={disabled}
                />
                <bottun
                    className="btn"
                    onClick={handleClickMax}
                >
                    max
                </bottun>
            </div>
            <h3>Wallet balance <span>{collateralBalanceString} wETH</span></h3>
        </div>
    );

    let selectBorrowAsset = (
        <div className="amount_section">
        <h5>2/3</h5>
        <h4>Choose An Asset To borrow</h4>
            <button className="btn dropdown-toggle" style={{ "height" : "44px", "padding" : "5px 0px"}} type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                    <span><img style={{ "width" : "24px", "margin-top" : "-2px" }} src={dai_logo} alt="dai logo" /></span>
                    <span style={{ "margin-right" : "77.5%", "margin-left" : "7.5px" }}>DAI</span>
                    <span><img src={dropdown_button}/></span>
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                <li><a className="dropdown-item" href="#">Action</a></li>
                <li><a className="dropdown-item" href="#">Another action</a></li>
                <li><a className="dropdown-item" href="#">Something else here</a></li>
            </ul>
        </div>
    );

    let selectBorrowAmount = (
        <div className="amount_section">
            <h5>3/3</h5>
            <h4>Enter An Amount To borrow</h4>
            <div className="input_section">
                <input
                    type="text"
                    placeholder="00.00"
                    onChange={handleDInput}
                    value={dInput}
                    disabled={disabled}
                />
            </div>
            <h3>Max Available to borrow <span>{maxBorrowString} DAI</span></h3>

            <div className="amount_section_text">
                <h3 className={!resultantCollatRatioSafe ? "unhealthy_collat_ratio" : "healthy_collat_ratio"}>Implied Collateralization Ratio <span>{getEffCollatRatioString()} %</span></h3>
                <h3>Minimum Collateralization Ratio <span>{parseInt(process.env.REACT_APP_COLLATERALIZATION_FACTOR)+5} %</span></h3> 
            </div>

        </div>
    );


    let sufficientWETHApproval = approvedCollateral == null || balanceCollateral == null || approvedCollateral.gte(balanceCollateral);
    const txMessage = !sufficientWETHApproval ? "Approving WETH" : "Opening Position";
	const LoadingContents = sentState ? txMessage : 'Waiting For Confirmation';
	const InputContents = cInput === '' || cInput === null || Number(cInput) === 0 ? 'Enter A Collateral Amount' : 'Enter A Borrow Amount';

    let buttons = (
        <>
            {!sufficientWETHApproval && <button className="btn activate" onClick={approveOnClick}>Approve WETH</button>}
            <>
                {Number(collateralBalanceString) < Number(cInput) ?
                <button
                    className="btn btn-deactive"
                >
                Insufficient Balance For Transaction
                </button>
                :
                <>
                {dInput === '' || cInput === '' || dInput === null  || Number(dInput) === 0 ?
                    <>
                    {wasError &&
                    <p className="text-center error-text" style={{ color: '#ef767a'}}>Something went wrong. Try again later.</p>
                    }
                    <button
                        className={wasError ? "btn btn-deactive mt-0":"btn btn-deactive"}
                    >
                    {InputContents}
                    </button>
                    </>
                :
                    <>
                    {!resultantCollatRatioSafe  ?
                        <button
                        className="btn btn-deactive"
                        >
                        Not Enough Collateral
                        </button>
                    :
                        <>
                        {waitConfirmation ?
                        <button
                        className="btn btn-deactive"
                        >
                            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span className="ms-3">{LoadingContents}</span>
                        </button>
                        :
                            <button className={"btn "+(sufficientWETHApproval ? "" : "di")+"activate"} onClick={openVaultOnClick}>Open Vault, Borrow DAI</button>
                        }
                        </>
                    }
                    </>
                }
                </>
                }
            </>
        </>
    );

    let inputs = (
        success === SUCCESS_STATUS.BASE &&
        <div className="manage_popup">
            <Modal.Header closeButton className={sentState || waitConfirmation ? "deposit-header": ""}>
            <h5>Open Borrowing Position</h5>
            </Modal.Header>
            <Modal.Body>
               <div className="managepopup_details">

                    {selectCollateralAmount}

                    {selectBorrowAsset}

                    {selectBorrowAmount}

                    {buttons}

               </div>
            </Modal.Body>
        </div>
    );

    let successModal = (
        <Modal
            show={success === SUCCESS_STATUS.APPROVAL_SUCCESS || success === SUCCESS_STATUS.OPEN_SUCCESS}
            onHide={handleClosesuccess}
            centered
            animation={false}
            className="deposit-modal"
        >
            <SuccessModal handleClosesuccess={handleClosesuccess} />
        </Modal>
    );

    const errorModal = (
        <Modal
          show={success === SUCCESS_STATUS.ERROR}
          onHide={handleErrorClose}
          centered
          animation={false}
          className="deposit-modal"
        >
          <ErrorModal handleErrorClose={handleErrorClose}/>
        </Modal>
    );

    return (
        <div>
            {inputs}
            {successModal}
            {errorModal}
        </div>
    )
}
export default ManagePositionPopup;
import React, { useState, useEffect } from 'react'
import Modal from "react-bootstrap/Modal";
import "./managepopup.scss";
import SuccessModal from "../../Success/SuccessModal";
import { filterInput, getDecimalString, getAbsoluteString } from '../../../Utils/StringAlteration.js';
import { TOTAL_SBPS, _0, INF } from '../../../Utils/Consts.js';
import { ethers, BigNumber as BN } from 'ethers';
import { SendTx } from '../../../Utils/SendTx';

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
    collateralAggDecimals
}) => {

    const SUCCESS_STATUS = {
        BASE: 0,
        APPROVAL_SUCCESS: 1,
        OPEN_SUCCESS: 2
    }
    const [success, setSuccess] = useState(SUCCESS_STATUS.BASE);

    const [cInput, setCInput] = useState(null);
    const [dInput, setDInput] = useState(null);

    const [balanceCollateral, setBalanceCollateral] = useState(null);
    const [approvedCollateral, setApprovedCollateral] = useState(null);
    const [maxBorrowAmount, setMaxBorrowAmount] = useState(null);
    const [collatRatioCheck, setCollatRatioCheck] = useState(false); // This variable controls the color of the Implied Collateralization Ratio

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

    async function approveOnClick() {
        if (CASSET !== null && CMM !== null) {
            await SendTx(userAddress, CASSET, 'approve', [CMM.address, INF.toString()]);
            setSuccess(SUCCESS_STATUS.APPROVAL_SUCCESS);
            setBalanceCollateral(null);
            setApprovedCollateral(null);
        }
    }

    async function openVaultOnClick() {
        if (
            approvedCollateral != null && balanceCollateral != null && !collateralAmountInput.eq(_0) && !debtAmountInput.eq(_0) &&
            getEffCollatRatioBN().div(BN.from(10).pow(BN.from(16))).gte(BN.from(process.env.REACT_APP_COLLATERALIZATION_FACTOR).add(BN.from(5)))
        ) {
            await SendTx(userAddress, CMM, 'openCVault', [process.env.REACT_APP_COLLATERAL_ADDRESS, collateralAmountInput.toString(), debtAmountInput.toString()]);
            await setSuccess(SUCCESS_STATUS.OPEN_SUCCESS);
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
        setMaxBorrowAmount(_maxBorrowAmount);
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
            <h5>1/2</h5>
            <h4>Enter collateral amount</h4>
            <div className="input_section">
                <input
                    type="text"
                    placeholder="00.00"
                    onChange={handleCInput}
                    value={cInput}
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

    let selectBorrowAmount = (
        <div className="amount_section">
            <h5>2/2</h5>
            <h4>Enter an Amount to borrow</h4>
            <div className="input_section">
                <input
                    type="text"
                    placeholder="00.00"
                    onChange={handleDInput}
                    value={dInput}
                />
            </div>
            <h3>Max Available to borrow <span>{maxBorrowString} DAI</span></h3>

            <div className="amount_section_text">
                <h3 className={!resultantCollatRatioSafe ? "unhealthy_collat_ratio" : "healthy_collat_ratio"}>Implied Collateralization Ratio <span>{getEffCollatRatioString()} %</span></h3>
                <h3>Minimum Collateralization Ratio <span>{parseInt(process.env.REACT_APP_COLLATERALIZATION_FACTOR)+5} %</span></h3> 
            </div>

        </div>
    );


    let sufficientWETHApproval = approvedCollateral == null || balanceCollateral == null || approvedCollateral.eq(_0) || approvedCollateral.gte(balanceCollateral);
    let buttons = (
        <>
            {!sufficientWETHApproval && <button className="btn activate" onClick={approveOnClick}>Approve WETH</button>}
            <button className={"btn "+(sufficientWETHApproval ? "" : "di")+"activate"} onClick={openVaultOnClick}>Open Vault, Borrow DAI</button>
        </>
    );

    let inputs = (
        success == SUCCESS_STATUS.BASE &&
        <div className="manage_popup">
            <Modal.Header closeButton>
            <h5>Open Borrowing Position</h5>
            </Modal.Header>
            <Modal.Body>
               <div className="managepopup_details">

                    {selectCollateralAmount}

                    {selectBorrowAmount}

                    {buttons}

               </div> 
            </Modal.Body>
        </div>
    );

    let successmodal = (
        <Modal
            show={success != SUCCESS_STATUS.BASE}
            onHide={handleClosesuccess}
            centered
            animation={false}
            className="deposit-modal"
        >
            <SuccessModal handleClosesuccess={handleClosesuccess} />
        </Modal>
    );

    return (
        <div>
            {inputs}
            {successmodal}
        </div>
    )
}
export default ManagePositionPopup;
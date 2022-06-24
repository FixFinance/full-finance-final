import React, { useState, useContext, useEffect } from 'react'
import Modal from "react-bootstrap/Modal";
import "./managepopup.scss";
import SuccessModal from "../../Success/SuccessModal";
import ErrorModal from '../../ErrorModal/Errormodal';
import { filterInput, getDecimalString, getAbsoluteString } from '../../../Utils/StringAlteration.js';
import { TOTAL_SBPS, _0, INF, COLLATERAL_ADDRESSES, COLLATERAL_SYMBOLS } from '../../../Utils/Consts.js';
import { ethers, BigNumber as BN } from 'ethers';
import { EthersContext } from '../../EthersProvider/EthersProvider';
import { getNonce, getSendTx } from '../../../Utils/SendTx';
import { hoodEncodeABI } from '../../../Utils/HoodAbi';
import { BNmin, BNmax } from '../../../Utils/BNtools';
import dai_logo from '../../../assets/image/dai.svg';
import weth_logo from '../../../assets/image/weth.svg'
import steth_logo from '../../../assets/image/lidosteth.png';
import dropdown_button from '../../../assets/image/dropdown-button.svg';
import dropdown_deactive from '../../../assets/image/dropdown_deactive.svg'

const ManagePositionPopup = ({
    handleClose,
    provider,
    signer,
    userAddress,
    CMM,
    DAI,
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

    const IERC20ABI = require('../../../abi/IERC20.json');

    const SUCCESS_STATUS = {
        BASE: 0,
        APPROVAL_SUCCESS: 1,
        OPEN_SUCCESS: 2,
        ERROR: 3
    }
    const [success, setSuccess] = useState(SUCCESS_STATUS.BASE);
    const [wasError, setWasError] = useState(false);
    const [approving, setApproving] = useState(false);
    const [waitConfirmation, setWaitConfirmation] = useState(false);
    const [sentState, setSentState] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [disabled2, setDisabled2] = useState(false);
    const [menu, setMenu] = useState(false);
    const [menu2, setMenu2] = useState(false);

    const [cInput, setCInput] = useState(null);
    const [dInput, setDInput] = useState(null);
    const [collateralAsset, setCollateralAsset] = useState(null);
    const [collateralSymbol, setCollateralSymbol] = useState(null);
    const [collateralAddress, setCollateralAddress] = useState("");
    const [borrowAsset, setBorrowAsset] = useState(null);

    const [balanceCollateral, setBalanceCollateral] = useState(null);
    const [wethBalance, setWETHBalance] = useState(null);
    const [wSTETHBalance, setWSTETHBalance] = useState(null);
    const [approvedCollateral, setApprovedCollateral] = useState(null);
    const [maxBorrowAmount, setMaxBorrowAmount] = useState(null);

    const [, , updateBasicInfo] = useContext(EthersContext);

    //Borrow-Lend Supply Difference
    const BLSdiff = supplyBorrowedBN != null && supplyLentBN != null ? supplyLentBN.sub(supplyBorrowedBN) : _0;
    const collateralBalanceString = balanceCollateral == null ? '0' : getDecimalString(balanceCollateral.toString(), parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS), 5);
    const maxBorrowString = maxBorrowAmount == null ? '0' : getDecimalString(maxBorrowAmount.toString(), parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS), 2);

    const collateralAmountInput = cInput == null ? _0 : BN.from(getAbsoluteString(cInput, parseInt(process.env.REACT_APP_COLLATERAL_DECIMALS)));
    const debtAmountInput = dInput == null ? _0 : BN.from(getAbsoluteString(dInput, parseInt(process.env.REACT_APP_BASE_ASSET_DECIMALS)));

    const CASSET = signer == null ? null : new ethers.Contract(collateralAddress, IERC20ABI, signer);
    const CASSET1 = provider == null ? null : new ethers.Contract(COLLATERAL_ADDRESSES[0], IERC20ABI, provider);
    const CASSET2 = provider == null ? null : new ethers.Contract(COLLATERAL_ADDRESSES[1], IERC20ABI, provider);


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

    const TxCallback0 = async () => {
        setSentState(true);        
    }

    const TxCallback1 = async () => {
        setSentState(false);
        setDisabled(false);
        setDisabled2(false);
        updateBasicInfo();
    }

    const SendTx = getSendTx(TxCallback0, TxCallback1);

    async function approveOnClick() {
        try {
            if (CASSET !== null && CMM !== null) {
                setApproving(true);
                setWaitConfirmation(true);
                await SendTx(userAddress, CASSET, 'approve', [CMM.address, INF.toString()]);
                setSuccess(SUCCESS_STATUS.APPROVAL_SUCCESS);
                setApproving(false);
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
                setDisabled2(true);
                await SendTx(userAddress, CMM, 'openCVault', [CASSET.address, collateralAmountInput.toString(), debtAmountInput.toString()]);
                setSuccess(SUCCESS_STATUS.OPEN_SUCCESS);
                setWaitConfirmation(false);
            }
        } catch (err) {
            setSuccess(SUCCESS_STATUS.ERROR);
            setDisabled(false);
            setDisabled2(false);
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

    const setBorrowAssetHandler = (asset) => {
        setBorrowAsset(asset)
        setMenu2(false);
    }

    const setCollateralAssetHandler = (asset) => {
        setMenu(false);
        setCollateralAsset(asset);
        let collateralIndex = COLLATERAL_SYMBOLS.indexOf(asset);
        setCollateralAddress(COLLATERAL_ADDRESSES[collateralIndex]);
        setCollateralSymbol(COLLATERAL_SYMBOLS[collateralIndex]);
    }


    useEffect(() => {
        if (balanceCollateral == null) {
            CASSET.balanceOf(userAddress).then(res => {
                setBalanceCollateral(res);
            });
            CASSET1.balanceOf(userAddress).then(res => {
                setWETHBalance(res);
            });
            CASSET2.balanceOf(userAddress).then(res => {
                setWSTETHBalance(res);
            });
        }
        if (approvedCollateral == null) {
            CASSET.allowance(userAddress, CMM.address).then(res => {
                setApprovedCollateral(res);
            });
        }

        if (cInput === '' || Number(cInput) === 0) {
            setMenu2(false);
        }

        collateralAsset === "WETH" ? setBalanceCollateral(wethBalance) : setBalanceCollateral(wSTETHBalance);

        collateralAsset === null ? setDisabled(true) : setDisabled(false);
        borrowAsset === null ? setDisabled2(true) : setDisabled2(false);

    }, [balanceCollateral, approvedCollateral, cInput, collateralAsset, borrowAsset]);

    const CollateralInput = collateralAsset ? collateralAsset : "Choose Asset";
    const CollateralClass = collateralAsset === "WETH" ? "weth-asset-span" : "wsteth-asset-span";

    let selectCollateralAsset = (
        <div className="amount_section mb-4">
        <h5>1/4</h5>
        <h4>Choose An Asset For Collateral</h4>
            <button className="btn dropdown-toggle" style={{ "height" : "44px", "padding" : "5px 0px"}} type="button" onClick={waitConfirmation === true || sentState === true ? "" : () => setMenu(!menu)} >
                    <span><img className={collateralAsset ? "asset-image" : "d-none"} src={collateralAsset === "WETH" ? weth_logo : steth_logo} alt="asset logo" /></span>
                    <span className={collateralAsset ? CollateralClass : "choose-asset-span"}>{CollateralInput}</span>
                    <span><img className={menu ? "rotated-up-arrow" : "rotated-down-arrow"} src={waitConfirmation === true || sentState === true ? dropdown_deactive : dropdown_button} alt="dropdown button"/></span>
            </button>
            <ul className={menu ? "asset-menu" : "d-none"} >
                <li onClick={() => setCollateralAssetHandler("WETH")}>
                  <div className="list-element-container">
                    <span><img className="dropdown-asset-image" src={weth_logo} alt="weth logo" /></span>
                    <span className="weth-asset-span">WETH</span>
                  </div>
                </li>
                <li onClick={() => setCollateralAssetHandler("wstETH")}>
                  <div className="list-element2-container">
                    <span><img className="dropdown-asset-image" src={steth_logo} alt="steth logo" /></span>
                    <span className="wsteth-asset-span">wstETH</span>
                  </div>
                </li>
            </ul>
        </div>
    );

    let selectCollateralAmount = (
        <div className="amount_section">
            <h5>2/4</h5>
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
            <h3>Wallet balance <span>{collateralBalanceString} {collateralSymbol}</span></h3>
        </div>
    );

    const AssetInput = borrowAsset ? borrowAsset : "Choose Asset";

    let selectBorrowAsset = (
        <div className="amount_section mb-4">
        <h5>3/4</h5>
        <h4>Choose An Asset To borrow</h4>
            <button className={cInput === '' || Number(cInput) === 0 || collateralAsset === null ? "btn drowdown-deactive" : "btn dropdown-toggle"} style={{ "height" : "44px", "padding" : "5px 0px"}} type="button" onClick={cInput === '' || Number(cInput) === 0 || collateralAsset === null || waitConfirmation === true || sentState === true ? "" : () => setMenu2(!menu2)} >
                    <span><img className={borrowAsset ? "asset-image" : "d-none"} src={dai_logo} alt="asset logo" /></span>
                    <span className={borrowAsset ? "selected-asset-span" : "choose-asset-span"}>{AssetInput}</span>
                    <span><img className={menu2 ? "rotated-up-arrow" : "rotated-down-arrow"} src={cInput === '' || Number(cInput) === 0 || collateralAsset === null || waitConfirmation === true || sentState === true ? dropdown_deactive : dropdown_button} alt="dropdown button"/></span>
            </button>
            <ul className={menu2 ? "asset-menu" : "d-none"} >
                <li onClick={() => setBorrowAssetHandler("DAI")}>
                  <div className="list-element-container">
                    <span><img className="dropdown-asset-image" src={dai_logo} alt="dai logo" /></span>
                    <span className="selected-asset-span">DAI</span>
                  </div>
                </li>
            </ul>
        </div>
    );

    let selectBorrowAmount = (
        <div className="amount_section">
            <h5>4/4</h5>
            <h4>Enter An Amount To borrow</h4>
            <div className="input_section">
                <input
                    type="text"
                    placeholder="00.00"
                    onChange={handleDInput}
                    value={dInput}
                    disabled={disabled2}
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
	const LoadingContents = sentState ? txMessage : "Waiting For Confirmation";
    const MoreInputContents = borrowAsset === null ? "Choose An Asset To Borrow" : "Enter An Amount To Borrow";
	const InputContents = cInput === '' || cInput === null || Number(cInput) === 0 ? "Enter Collateral Amount" : MoreInputContents;
    const InputContent = collateralAsset === null ? "Choose An Asset For Collateral" : InputContents;
    const BorrowCheck = !resultantCollatRatioSafe ? "Not Enough Collateral" : "Exceeds Max Avaliable Borrow";

    let buttons = (
        <>
            {!sufficientWETHApproval && <button className={!approving ? "btn activate" : "d-none"} onClick={approveOnClick}>Approve {collateralSymbol}</button>}
            <>
                {Number(collateralBalanceString) < Number(cInput) ?
                <button
                    className="btn btn-deactive"
                >
                Insufficient Balance For Transaction
                </button>
                :
                    <>
                    {approving &&
                        <button
                        className="btn btn-deactive"
                        >
                            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span className="ms-3">{LoadingContents}</span>
                        </button>
                    }
                        <>
                        {dInput === '' || cInput === '' || dInput === null  || Number(dInput) === 0 || collateralAsset === null || borrowAsset === null ?
                            <>
                            {wasError &&
                            <p className="text-center error-text" style={{ color: '#ef767a'}}>Something went wrong. Try again later.</p>
                            }
                            <button
                                className={wasError ? "btn btn-deactive mt-0":"btn btn-deactive"}
                            >
                            {InputContent}
                            </button>
                            </>
                        :
                            <>
                            {!resultantCollatRatioSafe || Number(dInput) > Number(maxBorrowString) ?
                                <button
                                className="btn btn-deactive"
                                >
                                {BorrowCheck}
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

                    {selectCollateralAsset}

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
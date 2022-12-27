import { BigNumber as BN } from 'ethers';

export const ADDRESS0 = '0x'+'0'.repeat(40);

export const INF_CHAR = '\u221E';

export const _0 = BN.from(0);

export const _1 = BN.from(1);

export const _2 = BN.from(2);

export const TOTAL_SBPS = BN.from(10).pow(BN.from(18));

export const INF = BN.from('0x'+'ff'.repeat(32));

export const COLLATERAL_ADDRESSES = process.env.REACT_APP_COLLATERAL_ADDRESSES.split(", ");

export const COLLATERAL_SYMBOLS = process.env.REACT_APP_COLLATERAL_SYMBOLS.split(", ");

export const COLLATERAL_AGGREGATOR_ADDRESSES = process.env.REACT_APP_COLLATERAL_AGGREGATOR_ADDRESSES.split(", ");

export const COLLATERAL_ESCROW_ADDRESSES = process.env.REACT_APP_COLLATERAL_ESCROW_ADDRESSES.split(", ");
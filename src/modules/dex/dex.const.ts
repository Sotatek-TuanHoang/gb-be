import BigNumber from 'bignumber.js';

export const BONE = new BigNumber(10).pow(18);
export const MIN_SCORE_PER_BLOCK = new BigNumber(10).pow(6);
export enum UserInfoAction {
  Stake = 'stake',
  UnStake = 'un_stake',
}

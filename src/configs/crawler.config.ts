// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as StakingJSON from 'src/abis/staking.json';
import * as ProposalJSON from 'src/abis/proposal-voter.json';
import { provider } from 'src/config/config';

export default {
  WEB3_API_URL: provider, // bsc testnet
  AVERAGE_BLOCK_TIME: 15000,
  REQUIRED_CONFIRMATION: 2,
  contracts: {
    CHN: {
      CONTRACT_DATA: StakingJSON.abi,
      CONTRACT_ADDRESS: process.env.STAKING_POOL_ADDRESS,
      FIRST_CRAWL_BLOCK: Number(process.env.STAKING_POOL_START_BLOCK), // Start Block: Block number that contract is created, develop version only
      BLOCK_NUM_IN_ONE_GO: Number(process.env.STAKING_POOL_BLOCK_NUM_IN_ONE_GO), // Number of blocks we fetch in one time
      BREAK_TIME_AFTER_ONE_GO: Number(
        process.env.STAKING_POOL_BREAK_TIME_AFTER_ONE_GO
      ),
    },
    CRAW_PROPOSAL_VOTER: {
      CONTRACT_DATA: ProposalJSON.abi,
      CONTRACT_ADDRESS: process.env.GOVERNANCE_MAIN_ADDRESS,
      FIRST_CRAWL_BLOCK: Number(process.env.GOVERNANCE_START_BLOCK), 
      BLOCK_NUM_IN_ONE_GO: Number(process.env.GOVERNANCE_BLOCK_NUM_IN_ONE_GO),
      BREAK_TIME_AFTER_ONE_GO: Number(
        process.env.GOVERNANCE_BREAK_TIME_AFTER_ONE_GO
      ),
    }
  },
};

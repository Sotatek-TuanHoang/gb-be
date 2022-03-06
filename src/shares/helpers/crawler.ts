// eslint-disable-next-line
const InputDataDecoder = require('ethereum-input-data-decoder');
import { ChainInfoRepository } from '../../models/repositories/chain-info.repository';
import { ABI } from 'src/shares/abis/pair';
import { MethodName } from '../enums/method-name.enum';

const BLOCK_TIME = 3000;
const STEP_BLOCK = 1;
const decoder = new InputDataDecoder(ABI);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function crawlByMethodName(
  // eslint-disable-next-line
  web3: any,
  chain_infos: ChainInfoRepository,
  // eslint-disable-next-line
  callback: (event) => void,
  contractAddress: string,
): Promise<void> {
  let cursor = 0;

  const latestBlock = await chain_infos.findOne({ id: 1 });
  if (latestBlock.current_block) cursor = Number(latestBlock.current_block);

  while (true) {
    cursor = Math.min(cursor + STEP_BLOCK, await web3.eth.getBlockNumber());
    const block = await web3.eth.getBlock(42110269);

    const transactionsP = [...block.transactions].map(async (tx) => {
      const txR = await web3.eth.getTransactionReceipt(tx);
      console.log('txR', txR);
      if (txR.status) {
        web3.eth.getTransaction(tx, (errT, txT) => {
          console.log('txT ===> ', txT);
          // TODO
          if (txT.to === contractAddress) {
            const a = decoder.decodeData(txT.input);
            const { method, inputs } = decoder.decodeData(txT.input);
            console.log('txR.logs >>>> >>>> >>>> ', txR.logs);
            const logs = txR.logs;
            console.log('aaaa >>>> >>>> >>>> ', a);
            console.log('inputs >>>> >>>> >>>> ', inputs);
            let amount;

            switch (method) {
              case MethodName.REMOVE_LIQUIDITY:
                amount = inputs[3].toString();
                break;
              case MethodName.ADD_LIQUIDITY:
                // TODO
                break;
              default:
                break;
            }

            console.log('amount', amount);

            if (
              method === MethodName.ADD_LIQUIDITY ||
              method === MethodName.REMOVE_LIQUIDITY
            )
              callback({
                method,
                blockNumber: cursor,
                from: txR.from,
                poolAddress: logs[3].address,
                amount,
              });
          }
        });
      }
    });

    await Promise.all(transactionsP);
    await chain_infos.update({ id: 1 }, { current_block: String(cursor) });
    await sleep(BLOCK_TIME);
  }
}

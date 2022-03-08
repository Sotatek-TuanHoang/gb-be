// eslint-disable-next-line
const InputDataDecoder = require('ethereum-input-data-decoder');
import { ChainInfoRepository } from '../../models/repositories/chain-info.repository';
import { ABI } from 'src/shares/abis/pair';
import { MethodName } from '../enums/method-name.enum';

// const BLOCK_TIME = 3000;
const STEP_BLOCK = 1;
const decoder = new InputDataDecoder(ABI);

// function sleep(ms: number): Promise<void> {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

export async function crawlByMethodName(
  // eslint-disable-next-line
  web3: any,
  chain_infos: ChainInfoRepository,
  // eslint-disable-next-line
  callback: (event) => void,
  contractAddress: string,
): Promise<void> {
  let cursor = 0;

  const chainInfos = await chain_infos.findOne({ id: 1 });
  if (chainInfos.current_block) cursor = Number(chainInfos.current_block);

  while (cursor <= Number(chainInfos.max_block)) {
    cursor = Math.min(cursor + STEP_BLOCK, await web3.eth.getBlockNumber());
    const block = await web3.eth.getBlock(cursor);
    const transactionsP = [...block.transactions].map(async (tx) => {
      const txR = await web3.eth.getTransactionReceipt(tx);
      if (txR.status && txR?.to === contractAddress.toLowerCase()) {
        const txT = await web3.eth.getTransaction(tx);
        const { method, inputs } = decoder.decodeData(txT.input);

        const logs = txR.logs;
        let amount;

        switch (method) {
          case MethodName.REMOVE_LIQUIDITY_ETH:
            amount = inputs[3].toString();
            break;
          case MethodName.ADD_LIQUIDITY_ETH: {
            const decodeLogs = web3.eth.abi.decodeLog(
              [
                {
                  indexed: true,
                  internalType: 'address',
                  name: 'from',
                  type: 'address',
                },
                {
                  indexed: true,
                  internalType: 'address',
                  name: 'to',
                  type: 'address',
                },
                {
                  indexed: false,
                  internalType: 'uint256',
                  name: 'value',
                  type: 'uint256',
                },
              ],
              logs[5].data,
              [logs[5].topics[1], logs[5].topics[2]],
            );
            amount = decodeLogs['2'];
            break;
          }
          case MethodName.REMOVE_LIQUIDITY:
            amount = inputs[3].toString();
            break;
          case MethodName.ADD_LIQUIDITY: {
            const decodeLogs = web3.eth.abi.decodeLog(
              [
                {
                  indexed: true,
                  internalType: 'address',
                  name: 'from',
                  type: 'address',
                },
                {
                  indexed: true,
                  internalType: 'address',
                  name: 'to',
                  type: 'address',
                },
                {
                  indexed: false,
                  internalType: 'uint256',
                  name: 'value',
                  type: 'uint256',
                },
              ],
              logs[2].data,
              [logs[2].topics[1], logs[2].topics[2]],
            );
            amount = decodeLogs['2'];
            break;
          }
          default:
            return;
        }
        if (
          method === MethodName.ADD_LIQUIDITY_ETH ||
          method === MethodName.REMOVE_LIQUIDITY_ETH ||
          method === MethodName.ADD_LIQUIDITY ||
          method === MethodName.REMOVE_LIQUIDITY
        ) {
          await callback({
            method,
            blockNumber: cursor,
            from: txR.from,
            poolAddress: logs[3].address,
            amount,
            tx_hash: tx,
          });
          return;
        }
        await callback({
          method,
          blockNumber: cursor,
          from: txR.from,
          poolAddress: '',
          amount: 0,
          tx_hash: tx,
        });
      }
    });

    await Promise.all(transactionsP);
    await chain_infos.update({ id: 1 }, { current_block: String(cursor) });
    // await sleep(BLOCK_TIME);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

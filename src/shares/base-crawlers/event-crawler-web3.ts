import { implement } from "sota-common";
import pLimit from "p-limit";
import BaseEventLogCrawler from "@/shares/helpers/base-event-log-crawler";

const Web3 = require("web3"); // cannot use import
const limit = pLimit(5);

export class EventCrawlerWeb3 extends BaseEventLogCrawler {
  /**
   * Process several blocks in one go. Just use single database transaction
   * @param {number} fromBlockNumber - begin of crawling blocks range
   * @param {number} toBlockNumber - end of crawling blocks range
   * @param {number} latestNetworkBlock - recent height of blockchain in the network
   *
   * @returns {number} the highest block that is considered as confirmed
   */
  @implement
  protected async processBlocks(
    fromBlockNumber: number,
    toBlockNumber: number,
    latestNetworkBlock: number
  ): Promise<void> {
    console.log(
      `processBlocks BEGIN_PROCESS_BLOCKS: ${fromBlockNumber}→${toBlockNumber} / ${latestNetworkBlock}`
    );

    console.log(
      `Contract ADDRESS: ${JSON.stringify(
        this.getOptions().contractConfig.CONTRACT_ADDRESS
      )}`
    );

    const web3 = new Web3(
      this.getOptions().networkConfig.WEB3_API_URL.toString()
    );

    const abi = this.getOptions().contractConfig.CONTRACT_DATA;
    const contract = new web3.eth.Contract(
      abi,
      this.getOptions().contractConfig.CONTRACT_ADDRESS
    );

    const eventLogs = await contract.getPastEvents(
      "allEvents",
      {
        fromBlock: fromBlockNumber,
        toBlock: toBlockNumber,
      },
      (err: any) => {
        if (err) {
          console.error(err);
        }
      }
    );
    console.log("eventLogs", eventLogs);

    const blockInfos = await this.getBlockTimeByBlockNumbers(eventLogs);

    const formatEventLogs = eventLogs.map((event: any) => {
      return { ...event, blockTime: blockInfos[event.blockNumber] };
    });

    const transactions = await this.getTransactions(eventLogs);
    if (transactions && transactions.length) {
      console.log("TRANSACTION", transactions.length);
    }
    const transactionReceipts = await this.getTransactionReceipts(eventLogs);
    if (transactionReceipts && transactionReceipts.length) {
      console.log("transactionReceipts", transactionReceipts.length);
    }

    await this.getOptions().onEventLogCrawled(
      this,
      formatEventLogs,
      transactions,
      transactionReceipts,
      toBlockNumber
    );

    console.log(
      `processBlocks FINISH_PROCESS_BLOCKS: ${fromBlockNumber}→${toBlockNumber} logs:${
        eventLogs.length
      }`
    );
  }

  @implement
  protected async getBlockCount(): Promise<number> {
    const web3 = new Web3(this.getOptions().networkConfig.WEB3_API_URL);
    const latestBlockNumber = await web3.eth.getBlockNumber();
    return latestBlockNumber - this.getRequiredConfirmation();
  }

  private async getBlockTimeByBlockNumbers(eventLogs: []): Promise<object[]> {
    const blockNumbers = Array.from(
      new Set(eventLogs.map((log: any) => log.blockNumber))
    );
    const blockInfos = await Promise.all(
      blockNumbers.map(async (blockNumber: number) =>
        limit(() => this.getBlockInfo(blockNumber))
      )
    );
    return blockInfos.reduce((blockTimeByNumber: any, blockInfo: any) => {
      return {
        ...blockTimeByNumber,
        [blockInfo.number]: blockInfo.timestamp,
      };
    }, {});
  }

  private async getBlockInfo(blockNumber: number): Promise<object> {
    const web3 = new Web3(this.getOptions().networkConfig.WEB3_API_URL);
    return web3.eth.getBlock(blockNumber);
  }

  private async getTransactions(eventLogs: []): Promise<object[]> {
    return Promise.all(
      eventLogs.map(async (eventLog: any) =>
        limit(() => this.getTransaction(eventLog.transactionHash))
      )
    );
  }

  private async getTransaction(txHash: string): Promise<object> {
    const web3 = new Web3(this.getOptions().networkConfig.WEB3_API_URL);
    return web3.eth.getTransaction(txHash);
  }

  private async getTransactionReceipts(eventLogs: []): Promise<object[]> {
    return Promise.all(
      eventLogs.map(async (eventLog: any) =>
        limit(() => this.getTransactionReceipt(eventLog.transactionHash))
      )
    );
  }

  private async getTransactionReceipt(txHash: string): Promise<object> {
    const web3 = new Web3(this.getOptions().networkConfig.WEB3_API_URL);
    return web3.eth.getTransactionReceipt(txHash);
  }
}

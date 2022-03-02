import { BaseIntervalWorker, implement } from 'sota-common';

import { getWeb3ProviderLink } from 'src/shares/base-crawlers/utils';

// Store in-progress block
let LATEST_PROCESSED_BLOCK = NaN;
const REQUIRE_BLOCK_CONFIRMATION = process.env.REQUIRE_BLOCK_CONFIRMATION || 15; // hardcode for BSC

// Crawler options, usually are functions to handle project-related logic
// Something like getting and updating data to database, ...
export interface IEventLogCrawlerOptions {
  readonly onEventLogCrawled: (
    crawler: BaseEventLogCrawler,
    eventLogs: any,
    transactions: any,
    transactionReceipts: any,
    lastBlockNumber: number,
  ) => Promise<void>;
  readonly getLatestCrawledBlockNumber: () => Promise<number>;
  readonly networkConfig: any;
  readonly contractConfig: any;
}

export abstract class BaseEventLogCrawler extends BaseIntervalWorker {
  protected readonly _options: IEventLogCrawlerOptions;

  constructor(options: IEventLogCrawlerOptions) {
    super();
    this._options = options;
  }

  public getOptions(): IEventLogCrawlerOptions {
    this._options.networkConfig.WEB3_API_URL = getWeb3ProviderLink();
    return this._options;
  }

  @implement
  protected async prepare(): Promise<void> {
    // Do we need any preparation here yet?
  }

  @implement
  protected async doProcess(): Promise<void> {
    // Firstly try to get latest block number from network
    const latestNetworkBlock = await this.getBlockCount();

    // And looking for the latest processed block in local
    let latestProcessedBlock = LATEST_PROCESSED_BLOCK;

    // If there's no data in-process, then try to find it from environment variable
    if (
      !latestProcessedBlock &&
      this.getOptions().contractConfig.FORCE_CRAWL_BLOCK
    ) {
      latestProcessedBlock = parseInt(
        this.getOptions().contractConfig.FORCE_CRAWL_BLOCK,
        10,
      );
    }

    // If still no data, use the callback in options to get the initial value for this process
    if (!latestProcessedBlock || isNaN(latestProcessedBlock)) {
      latestProcessedBlock = await this.getOptions().getLatestCrawledBlockNumber();
    }
    if (
      !latestProcessedBlock &&
      this.getOptions().contractConfig.FIRST_CRAWL_BLOCK
    ) {
      latestProcessedBlock = parseInt(
        this.getOptions().contractConfig.FIRST_CRAWL_BLOCK,
        10,
      );
    }

    // If there's no data, just process from the newest block on the network
    if (!latestProcessedBlock) {
      latestProcessedBlock = latestNetworkBlock - 1;
    }

    /**
     * Start with the next block of the latest processed one
     */
    const fromBlockNumber = latestProcessedBlock + 1;

    /**
     * If crawled the newest block already
     * Wait for a period that is equal to average block time
     * Then try crawl again (hopefully new block will be available then)
     */

    if (fromBlockNumber > latestNetworkBlock) {
      console.log(
        `Block <${fromBlockNumber}> is the newest block can be processed (on network: ${latestNetworkBlock}). Wait for the next tick...`
      );
      return;
    }

    /**
     * Try to process several blocks at once, up to the newest one on the network
     */
    let toBlockNumber = latestProcessedBlock + this.getBlockNumInOneGo();
    if (toBlockNumber > latestNetworkBlock) {
      toBlockNumber = latestNetworkBlock;
    }


    if (toBlockNumber - fromBlockNumber < REQUIRE_BLOCK_CONFIRMATION) {
      console.log('Waiting for new block ...');
      return;
    }

    console.log(`crawler from block ${fromBlockNumber} -> ${toBlockNumber}`);
    /**
     * Actual crawl and process blocks
     * about 10 minutes timeout based on speed of gateway
     */
    await this.processBlocks(
      fromBlockNumber,
      toBlockNumber,
      latestNetworkBlock,
    );
    /**
     * Cache the latest processed block number
     * Do the loop again in the next tick
     */
    LATEST_PROCESSED_BLOCK = toBlockNumber;

    if (toBlockNumber >= latestNetworkBlock) {
      // If the newest block is processed already, will check the next tick after 1 block time duration
      console.log(
        `Have processed newest block already. Will wait for a while until next check...`,
      );
      this.setNextTickTimer(this.getAverageBlockTime());
    } else {
      // Otherwise try to continue processing immediately
      this.setNextTickTimer(this.getBreakTimeAfterOneGo());
    }

    return;
  }

  protected getBlockNumInOneGo(): number {
    return parseInt(this.getOptions().contractConfig.BLOCK_NUM_IN_ONE_GO, 10);
  }

  protected getAverageBlockTime(): number {
    return parseInt(this.getOptions().networkConfig.AVERAGE_BLOCK_TIME, 10);
  }

  protected getBreakTimeAfterOneGo(): number {
    return (
      parseInt(this.getOptions().contractConfig.BREAK_TIME_AFTER_ONE_GO, 10) ||
      1
    );
  }

  protected getRequiredConfirmation(): number {
    return parseInt(this.getOptions().networkConfig.REQUIRED_CONFIRMATION, 10);
  }

  protected abstract processBlocks(
    fromBlock: number,
    toBlock: number,
    latestBlock: number,
  ): Promise<void>;

  protected abstract getBlockCount(): Promise<number>;
}

export default BaseEventLogCrawler;

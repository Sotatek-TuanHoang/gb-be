/* eslint-disable @typescript-eslint/explicit-function-return-type */
import networkConfig from '@/configs/crawler.config';

export function getWeb3ProviderLink(): string {
  const WEB3_API_URLS = [networkConfig.WEB3_API_URL];
  const randomElement =
    WEB3_API_URLS[Math.floor(Math.random() * WEB3_API_URLS.length)];
  return randomElement;
}

export const hash = (s: string) => {
  return '-' + s;
};

interface EventInfo {
  name: string;
  handle: any;
  hashKeys: string[];
}

export function formatLogs(
  logs: any[],
  ignoreEvents: string[],
  mergeEvents: EventInfo[],
) {
  const result = {} as any;

  for (const log of logs) {
    if (ignoreEvents.includes(log.event)) {
      result[log.transactionHash] = log;
      continue;
    }

    let key = '';
    const eventManager = mergeEvents.filter((e) => {
      return e.name === log.event;
    });

    if (!eventManager[0]) continue;
    const event = eventManager[0];

    const hashKeys = event.hashKeys;
    for (const val of hashKeys) {
      key += hash(log.returnValues[val]);
    }
    result[key] = event.handle(result[key], log);
  }

  return Object.keys(result).map((key) => result[key]);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const timestampToDate = (time: number) => {
  return `${new Date(time).getFullYear()} - ${
    new Date(time).getMonth() + 1
  } - ${new Date(time).getDate()}`;
};

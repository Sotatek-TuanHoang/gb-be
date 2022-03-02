import {
  settleEnvironment,
} from 'sota-common';

export async function prepareEnvironment(): Promise<void> {
  console.log(`Crawler has been started.`);
  await settleEnvironment();
  console.log(`Environment has been setup successfully...`);
  return;
}
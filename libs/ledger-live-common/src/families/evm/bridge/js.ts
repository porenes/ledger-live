import type { AccountBridge, CurrencyBridge } from "../../../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";

import type { Transaction as EvmTransaction } from "../types";
import { sync, scanAccounts } from "../js-synchronization";
import {
  createTransaction,
  prepareTransaction,
} from "../js-prepareTransaction";
import BigNumber from "bignumber.js";
// import { estimateMaxSpendable } from "../js-estimateMaxSpendable";
// import { getTransactionStatus } from "../js-getTransactionStatus";
// import { signOperation } from "../js-signOperation";
// import { broadcast } from "../js-broadcast";

const receive = makeAccountBridgeReceive();

const updateTransaction = (t, patch): EvmTransaction => {
  return { ...t, ...patch };
};

const preload = async (): Promise<Record<any, any>> => Promise.resolve({});

const hydrate = (): void => {};

const currencyBridge: CurrencyBridge = {
  preload,
  hydrate,
  scanAccounts,
};

const accountBridge: AccountBridge<EvmTransaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus: async () => {
    return Promise.resolve({
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    });
  },
  sync,
  receive,
  signOperation: () => ({} as any),
  broadcast: async () => ({} as any),
  estimateMaxSpendable: async () => ({} as any),
};

export default {
  currencyBridge,
  accountBridge,
};

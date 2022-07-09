import BigNumber from "bignumber.js";
import { Account } from "../../types";
import { Transaction as EvmTransaction } from "./types";

export const createTransaction = (): EvmTransaction => ({
  family: "evm",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  gasPrice: new BigNumber(0),
  gasLimit: new BigNumber(21000),
  nonce: 0,
  chainId: 1,
});

export const prepareTransaction = async (
  a: Account,
  t: EvmTransaction
): Promise<EvmTransaction> => Promise.resolve(t);

import BigNumber from "bignumber.js";
import { TransactionCommon, TransactionCommonRaw } from "../../types";

export type EvmTransactionMode = "send";

export type EvmTransactionBase = TransactionCommon & {
  family: "evm";
  mode: "send";
  nonce: number;
  gasLimit: BigNumber;
  chainId: number;
  value?: BigNumber;
  data?: Buffer | null;
  type?: BigNumber;
};

export type EvmTransactionLegacy = EvmTransactionBase & {
  gasPrice: BigNumber;
  maxPriorityFeePerGas?: never;
  maxFeePerGas?: never;
};

export type EvmTransactionEIP1559 = EvmTransactionBase & {
  gasPrice?: never;
  maxPriorityFeePerGas: BigNumber;
  maxFeePerGas: BigNumber;
};

export type Transaction = EvmTransactionLegacy | EvmTransactionEIP1559;

export type EvmTransactionBaseRaw = TransactionCommonRaw & {
  family: "evm";
  mode: "send";
  nonce: number;
  gasLimit: string;
  chainId: number;
  value?: string;
  data?: string | null;
  type?: string;
};

export type EvmTransactionLegacyRaw = EvmTransactionBaseRaw & {
  gasPrice: string;
  maxPriorityFeePerGas?: never;
  maxFeePerGas?: never;
};

export type EvmTransactionEIP1559Raw = EvmTransactionBaseRaw & {
  gasPrice?: never;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
};

export type TransactionRaw = EvmTransactionLegacyRaw | EvmTransactionEIP1559Raw;

// export type TransactionBase = TransactionCommon & {
//   family: "evm";
//   mode: TransactionMode;
//   hash: string;
//   from: string;
//   nonce: number;
//   data: Buffer;
//   chainId: number;
//   blockNumber: number;
//   blockHash: string;
//   timestamp: number;
//   confirmations: number;
//   type: number;
//   gasLimit: BigNumber;
// };

// export type TransactionLegacy = TransactionBase & {
//   gasPrice: BigNumber;
//   maxFeePerGas?: never;
//   maxPriorityFeePerGas?: never;
// };

// export type TransactionEIP1559 = TransactionBase & {
//   gasPrice?: never;
//   maxFeePerGas: BigNumber;
//   maxPriorityFeePerGas: BigNumber;
// };

// export type Transaction = TransactionLegacy | TransactionEIP1559;

// export type TransactionRaw = TransactionCommonRaw & {
//   family: "evm";
//   mode: TransactionMode;
//   hash: string;
//   from: string;
//   nonce: number;
//   gasLimit: string;
//   gasPrice: null | string;
//   maxFeePerGas: string;
//   maxPriorityFeePerGas: string;
//   data: string;
//   chainId: number;
//   blockNumber: number;
//   blockHash: string;
//   timestamp: number;
//   confirmations: number;
//   type: number;
// };

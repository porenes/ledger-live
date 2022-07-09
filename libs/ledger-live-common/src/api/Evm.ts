import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/cryptoassets";
// import { EvmTransaction } from "../families/evm/types";

type AsyncApiFunction = (api: ethers.providers.JsonRpcProvider) => Promise<any>;

let provider: ethers.providers.JsonRpcProvider | null = null;

/**
 * Connects to RPC Node
 */
async function withApi(
  currency: CryptoCurrency,
  execute: AsyncApiFunction
): Promise<any> {
  console.log("CURRENCY", currency);
  if (!currency?.rpc) {
    throw new Error("Currency doesn't have an RPC node provided");
  }
  // If client is instanciated already, ensure it is connected & ready
  if (!provider?.connection) {
    provider = new ethers.providers.JsonRpcProvider(currency.rpc);
  }

  try {
    return await execute(provider);
  } catch {
    // Handle Error or Retry
    await disconnect();
  }
}

/**
 * Disconnects EVM provider
 */
export const disconnect = (): void => {
  provider = null;
};

type GetAccountFn = (
  currency: CryptoCurrency,
  addr: string
) => Promise<{ blockHeight: number; balance: BigNumber; nonce: number }>;

/**
 * Get account balances and nonce
 */
export const getAccount: GetAccountFn = async (currency, addr) =>
  withApi(currency, async (api) => {
    console.log("curr wesh", currency);
    try {
      const [balance, nonce, blockHeight] = await Promise.all([
        api.getBalance(addr),
        api.getTransactionCount(addr),
        api.getBlockNumber(),
      ]);

      return {
        blockHeight,
        balance: new BigNumber(balance.toString()),
        nonce,
      };
    } catch (e) {
      console.error(e);
    }
  });

export const getTransaction = (
  currency: CryptoCurrency,
  hash: string
): Promise<ethers.providers.TransactionResponse> =>
  withApi(currency, (api) => {
    return api.getTransaction(hash);
  });

// /**
//  * Returns true if account is the signer
//  */
// function isSender(transaction: Transaction, addr: string): boolean {
//   return transaction.from === addr;
// }

// /**
//  * Map transaction to an Operation Type
//  */
// function getOperationType(
//   transaction: EvmTransaction,
//   addr: string
// ): OperationType {
//   return isSender(transaction, addr) ? "OUT" : "IN";
// }

// /**
//  * Map transaction to a correct Operation Value (affecting account balance)
//  */
// function getOperationValue(
//   transaction: EvmTransaction,
//   addr: string
// ): BigNumber {
//   return isSender(transaction, addr)
//     ? transaction.amount.plus(0)
//     : transaction.amount.plus(0);
// }

// /**
//  * Extract extra from transaction if any
//  */
// function getOperationExtra(): any {
//   return {
//     // additionalField: transaction.additionalField,
//   };
// }

// /**
//  * Map the MyCoin history transaction to a Ledger Live Operation
//  */
// function transactionToOperation(
//   accountId: string,
//   addr: string,
//   transaction: EvmTransaction
// ): any {
//   const type = getOperationType(transaction, addr);

//   return {
//     // id: transaction.hash,
//     // accountId,
//     // fee: BigNumber(transaction.fees || 0),
//     // value: getOperationValue(transaction, addr),
//     type,
//     // // This is where you retrieve the hash of the transaction
//     hash: transaction.hash,
//     // blockHash: null,
//     // blockHeight: transaction.blockNumber,
//     // date: new Date(transaction.timestamp),
//     // extra: getOperationExtra(transaction),
//     // senders: [transaction.sender],
//     // recipients: transaction.recipient ? [transaction.recipient] : [],
//     // transactionSequenceNumber: isSender(transaction, addr)
//     //   ? transaction.nonce
//     //   : undefined,
//     // hasFailed: !transaction.success,
//   };
// }

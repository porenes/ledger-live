import { CryptoCurrency } from "@ledgerhq/cryptoassets";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { Account, encodeAccountId, Operation } from "../../types";
import { getAccount, getTransaction } from "../../api/Evm";
import { GetAccountShape } from "../../bridge/jsHelpers";
import { decodeOperationId } from "../../operation";

const MINIMUM_CONFIRMATIONS = 5;

const getAccountShape: GetAccountShape = async (info) => {
  console.warn("INFO WESH", info);
  const { initialAccount, address, derivationMode, currency } = info;
  const { blockHeight, balance, nonce } = await getAccount(currency, address);

  // Trying to confirm pending operations
  const confirmPendingOperations =
    initialAccount?.pendingOperations?.map((op) =>
      getOperationStatus(currency, op)
    ) || [];
  const maybeConfirmedOperations = await Promise.all(confirmPendingOperations);
  const confirmedOperations = maybeConfirmedOperations.filter(
    (op): op is Operation => !!op
  );

  const operations = mergeOps(
    initialAccount?.operations || [],
    confirmedOperations
  );

  const partialAccount: Partial<Account> = {
    id: encodeAccountId({
      type: "Account",
      version: "1",
      currencyId: currency.id,
      xpubOrAddress: address,
      derivationMode,
    }),
    balance,
    spendableBalance: balance,
    operationsCount: nonce,
    blockHeight,
    operations,
  };

  return partialAccount;
};

const getOperationStatus = async (
  currency: CryptoCurrency,
  op: Operation
): Promise<Operation | null> => {
  const { hash } = decodeOperationId(op.id);
  try {
    const {
      blockNumber: blockHeight,
      blockHash,
      timestamp,
      confirmations,
      nonce,
    } = await getTransaction(currency, hash);

    return confirmations >= MINIMUM_CONFIRMATIONS
      ? ({
          ...op,
          transactionSequenceNumber: nonce,
          blockHash,
          blockHeight,
          date: new Date(timestamp || ""),
        } as Operation)
      : null;
  } catch (e) {
    return null;
  }
};

const postSync = (initial: Account, parent: Account) => parent;

export const scanAccounts = makeScanAccounts({ getAccountShape });

export const sync = makeSync({ getAccountShape, postSync });

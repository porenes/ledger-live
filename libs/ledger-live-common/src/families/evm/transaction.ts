import type {
  Transaction as EvmTransaction,
  TransactionRaw as EvmTransactionRaw,
} from "./types";
import { BigNumber } from "bignumber.js";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import type { Account } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

export const formatTransaction = (
  { mode, amount, recipient, useAllAmount }: EvmTransaction,
  account: Account
): string =>
  `
${mode.toUpperCase()} ${
    useAllAmount
      ? "MAX"
      : amount.isZero()
      ? ""
      : " " +
        formatCurrencyUnit(getAccountUnit(account), amount, {
          showCode: true,
          disableRounding: true,
        })
  }${recipient ? `\nTO ${recipient}` : ""}`;

export const fromTransactionRaw = (tr: EvmTransactionRaw): EvmTransaction => {
  const common = fromTransactionCommonRaw(tr);
  const tx: Partial<EvmTransaction> = {
    ...common,
    family: tr.family,
    mode: tr.mode,
    chainId: tr.chainId,
    nonce: tr.nonce,
    gasLimit: new BigNumber(tr.gasLimit),
  };

  if (tr.data) {
    tx.data = Buffer.from(tr.data);
  }

  if (tr.value) {
    tx.value = new BigNumber(tr.value);
  }

  if (tr.type) {
    tx.type = new BigNumber(tr.type);
  }

  if (tr.gasPrice) {
    tx.gasPrice = new BigNumber(tr.gasPrice);
  }

  if (tr.maxFeePerGas) {
    tx.maxFeePerGas = new BigNumber(tr.maxFeePerGas);
  }

  if (tr.maxPriorityFeePerGas) {
    tx.maxPriorityFeePerGas = new BigNumber(tr.maxPriorityFeePerGas);
  }

  return tx as EvmTransaction;
};

export const toTransactionRaw = (tr: EvmTransaction): EvmTransactionRaw => {
  const common = toTransactionCommonRaw(tr);
  const txRaw: Partial<EvmTransactionRaw> = {
    ...common,
    family: tr.family,
    mode: tr.mode,
    chainId: tr.chainId,
    nonce: tr.nonce,
    gasLimit: tr.gasLimit.toFixed(),
  };

  if (tr.type) {
    txRaw.type = tr.type.toFixed();
  }

  if (tr.data) {
    txRaw.data = Buffer.from(tr.data).toString("hex");
  }

  if (tr.gasPrice) {
    txRaw.gasPrice = tr.gasPrice?.toFixed();
  }

  if (tr.maxFeePerGas) {
    txRaw.maxFeePerGas = tr.maxFeePerGas?.toFixed();
  }

  if (tr.maxPriorityFeePerGas) {
    txRaw.maxPriorityFeePerGas = tr.maxPriorityFeePerGas?.toFixed();
  }

  return txRaw as EvmTransactionRaw;
};

export default { formatTransaction, fromTransactionRaw, toTransactionRaw };

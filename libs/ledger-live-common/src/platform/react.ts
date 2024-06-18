import { useCallback, useMemo } from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { accountToPlatformAccount, currencyToPlatformCurrency } from "./converters";
import {
  filterPlatformAccounts,
  filterPlatformCurrencies,
  AccountFilters,
  CurrencyFilters,
} from "./filters";
import { isPlatformSupportedCurrency } from "./helpers";
import {
  ListPlatformAccount,
  ListPlatformCurrency,
  PlatformCurrency,
  LiveAppManifest,
  PlatformAccount,
} from "./types";
import { getParentAccount } from "../account";
import { listCurrencies } from "../currencies";
import { WalletState } from "@ledgerhq/live-wallet/store";

/**
 * TODO: we might want to use "searchParams.append" instead of "searchParams.set"
 * to handle duplicated query params (example: "?foo=bar&foo=baz")
 *
 * We can also use the stringify method of qs (https://github.com/ljharb/qs#stringifying)
 */
export function usePlatformUrl(
  manifest: LiveAppManifest,
  inputs?: Record<string, string | undefined>,
): URL {
  return useMemo(() => {
    const url = new URL(manifest.url.toString());

    if (inputs) {
      for (const key in inputs) {
        const value = inputs[key];
        if (Object.prototype.hasOwnProperty.call(inputs, key) && value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }

    if (manifest.params) {
      url.searchParams.set("params", JSON.stringify(manifest.params));
    }

    return url;
  }, [manifest.url, manifest.params, inputs]);
}

export function usePlatformAccounts(
  walletState: WalletState,
  accounts: AccountLike[],
): PlatformAccount[] {
  return useMemo(() => {
    return accounts.map(account => {
      const parentAccount = getParentAccount(account, accounts);

      return accountToPlatformAccount(walletState, account, parentAccount);
    });
  }, [walletState, accounts]);
}

export function useListPlatformAccounts(
  walletState: WalletState,
  accounts: AccountLike[],
): ListPlatformAccount {
  const platformAccounts = usePlatformAccounts(walletState, accounts);
  return useCallback(
    (filters: AccountFilters = {}) => {
      return filterPlatformAccounts(platformAccounts, filters);
    },
    [platformAccounts],
  );
}

export function usePlatformCurrencies(): PlatformCurrency[] {
  return useMemo(() => {
    return listCurrencies(true).reduce<PlatformCurrency[]>((filtered, currency) => {
      if (isPlatformSupportedCurrency(currency)) {
        filtered.push(currencyToPlatformCurrency(currency));
      }
      return filtered;
    }, []);
  }, []);
}

export function useListPlatformCurrencies(): ListPlatformCurrency {
  const currencies = usePlatformCurrencies();

  return useCallback(
    (filters?: CurrencyFilters) => {
      return filterPlatformCurrencies(currencies, filters || {});
    },
    [currencies],
  );
}

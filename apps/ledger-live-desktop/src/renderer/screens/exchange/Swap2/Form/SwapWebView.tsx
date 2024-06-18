import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { context } from "~/renderer/drawers/Provider";
import WebviewErrorDrawer from "./WebviewErrorDrawer/index";

import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { SubAccount } from "@ledgerhq/types-live";
import { SwapOperation } from "@ledgerhq/types-live/lib/swap";
import BigNumber from "bignumber.js";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import { initialWebviewState } from "~/renderer/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewProps, WebviewState } from "~/renderer/components/Web3AppWebview/types";
import { TopBar } from "~/renderer/components/WebPlatformPlayer/TopBar";
import useTheme from "~/renderer/hooks/useTheme";
import {
  counterValueCurrencySelector,
  enablePlatformDevToolsSelector,
  languageSelector,
} from "~/renderer/reducers/settings";
import { useRedirectToSwapHistory } from "../utils/index";

import { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Box, Button } from "@ledgerhq/react-ui";
import { t } from "i18next";
import { usePTXCustomHandlers } from "~/renderer/components/WebPTXPlayer/CustomHandlers";
import { captureException } from "~/sentry/internal";

export class UnableToLoadSwapLiveError extends Error {
  constructor(message: string) {
    const name = "UnableToLoadSwapLiveError";
    super(message || name);
    this.name = name;
    this.message = message;
  }
}

export type SwapProps = {
  provider: string;
  fromAccountId: string;
  fromParentAccountId?: string;
  toAccountId: string;
  fromAmount: string;
  toAmount?: string;
  quoteId: string;
  rate: string;
  feeStrategy: string;
  customFeeConfig: string;
  cacheKey: string;
  loading: boolean;
  error: boolean;
  providerRedirectURL: string;
  toNewTokenId: string;
  swapApiBase: string;
  estimatedFees: string;
  estimatedFeesUnit: string;
};

export type SwapWebProps = {
  manifest: LiveAppManifest;
  swapState?: Partial<SwapProps>;
  liveAppUnavailable(): void;
  sourceCurrencyId?: string;
  targetCurrencyId?: string;
};

export const SwapWebManifestIDs = {
  Demo0: "swap-live-app-demo-0",
  Demo1: "swap-live-app-demo-1",
};

export const useSwapLiveAppManifestID = () => {
  const demo0 = useFeature("ptxSwapLiveAppDemoZero");
  const demo1 = useFeature("ptxSwapLiveAppDemoOne");
  switch (true) {
    case demo1?.enabled:
      return demo1?.params?.manifest_id ?? SwapWebManifestIDs.Demo1;
    case demo0?.enabled:
      return demo0?.params?.manifest_id ?? SwapWebManifestIDs.Demo0;
    default:
      return null;
  }
};

const SwapWebAppWrapper = styled.div`
  width: 100%;
  flex: 1;
`;

const SwapWebView = ({
  manifest,
  swapState,
  liveAppUnavailable,
  sourceCurrencyId,
  targetCurrencyId,
}: SwapWebProps) => {
  const {
    colors: {
      palette: { type: themeType },
    },
  } = useTheme();
  const dispatch = useDispatch();
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const { setDrawer } = React.useContext(context);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(languageSelector);
  const redirectToHistory = useRedirectToSwapHistory();
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const manifestID = useSwapLiveAppManifestID();
  const isDemo1Enabled = manifestID?.startsWith(SwapWebManifestIDs.Demo1);
  const hasSwapState = !!swapState;
  const customPTXHandlers = usePTXCustomHandlers(manifest);

  const { fromCurrency, addressFrom, toCurrency, addressTo } = useMemo(() => {
    const [, , fromCurrency, addressFrom] =
      getAccountIdFromWalletAccountId(swapState?.fromAccountId || "")?.split(":") || [];

    const [, , toCurrency, addressTo] =
      getAccountIdFromWalletAccountId(swapState?.toAccountId || "")?.split(":") || [];

    return {
      fromCurrency,
      addressFrom,
      toCurrency,
      addressTo,
    };
  }, [swapState?.fromAccountId, swapState?.toAccountId]);

  const customHandlers = useMemo(() => {
    return {
      ...loggerHandlers,
      ...customPTXHandlers,
      "custom.swapStateGet": () => {
        return Promise.resolve(swapState);
      },
      // TODO: when we need bidirectional communication
      // "custom.swapStateSet": (params: CustomHandlersParams<unknown>) => {
      //   return Promise.resolve();
      // },
      "custom.saveSwapToHistory": ({
        params,
      }: {
        params: { swap: SwapProps; transaction_id: string };
      }) => {
        const { swap, transaction_id } = params;
        if (!swap || !transaction_id || !swap.provider || !swap.fromAmount || !swap.toAmount) {
          return Promise.reject("Cannot save swap missing params");
        }
        const fromId = getAccountIdFromWalletAccountId(swap.fromAccountId);
        const toId = getAccountIdFromWalletAccountId(swap.toAccountId);
        if (!fromId || !toId) return Promise.reject("Accounts not found");
        const operationId = `${fromId}-${transaction_id}-OUT`;

        const swapOperation: SwapOperation = {
          status: "pending",
          provider: swap.provider,
          operationId,
          swapId: transaction_id,
          receiverAccountId: toId,
          tokenId: toId,
          fromAmount: new BigNumber(swap.fromAmount),
          toAmount: new BigNumber(swap.toAmount),
        };

        dispatch(
          updateAccountWithUpdater(fromId, account => {
            const fromCurrency = getAccountCurrency(account);
            const isFromToken = fromCurrency.type === "TokenCurrency";
            const subAccounts = account.type === "Account" && account.subAccounts;
            return isFromToken && subAccounts
              ? {
                  ...account,
                  subAccounts: subAccounts.map<SubAccount>((a: SubAccount) => {
                    const subAccount = {
                      ...a,
                      swapHistory: [...a.swapHistory, swapOperation],
                    };
                    return a.id === fromId ? subAccount : a;
                  }),
                }
              : { ...account, swapHistory: [...account.swapHistory, swapOperation] };
          }),
        );
        return Promise.resolve();
      },
      "custom.swapRedirectToHistory": () => {
        redirectToHistory();
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapState]);

  useEffect(() => {
    if (webviewState.url.includes("/unknown-error")) {
      // the live app has re-directed to /unknown-error. Handle this in callback, probably wallet-api failure.
      onSwapWebviewError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webviewState.url]);

  const hashString = useMemo(() => {
    const searchParams = new URLSearchParams();

    const swapParams = {
      provider: swapState?.provider,
      from: sourceCurrencyId,
      to: targetCurrencyId,
      amountFrom: swapState?.fromAmount,
      loading: swapState?.loading,
      addressFrom: addressFrom,
      addressTo: addressTo,
      networkFees: swapState?.estimatedFees,
      networkFeesCurrency: fromCurrency,
    };

    Object.entries(swapParams).forEach(([key, value]) => {
      if (value != null) {
        // Convert all values to string as URLSearchParams expects string values
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }, [
    addressFrom,
    addressTo,
    fromCurrency,
    swapState?.estimatedFees,
    swapState?.fromAmount,
    swapState?.loading,
    swapState?.provider,
    targetCurrencyId,
    sourceCurrencyId,
  ]);

  // return loader???
  if (!hasSwapState) {
    return null;
  }

  const onSwapWebviewError = (error?: SwapLiveError) => {
    console.error("onSwapWebviewError", error);
    setDrawer(WebviewErrorDrawer, error);
  };

  const onStateChange: WebviewProps["onStateChange"] = state => {
    setWebviewState(state);

    if (!state.loading && state.isAppUnavailable) {
      liveAppUnavailable();
      captureException(
        new UnableToLoadSwapLiveError(
          '"Failed to load swap live app using WebPlatformPlayer in SwapWeb",',
        ),
      );
    }
  };

  // Keep the previous UI
  // Display only the disabled swap button
  if (
    isDemo1Enabled &&
    (swapState.error ||
      swapState.fromAmount === "0" ||
      !(fromCurrency && addressFrom && toCurrency && addressTo))
  ) {
    return (
      <Box width="100%">
        <Button width="100%" disabled>
          {t("sidebar.swap")}
        </Button>
      </Box>
    );
  }

  return (
    <>
      {enablePlatformDevTools && (
        <TopBar
          manifest={{ ...manifest, url: `${manifest.url}#${hashString}` }}
          webviewAPIRef={webviewAPIRef}
          webviewState={webviewState}
        />
      )}

      <SwapWebAppWrapper>
        <Web3AppWebview
          manifest={{ ...manifest, url: `${manifest.url}#${hashString}` }}
          inputs={{
            theme: themeType,
            lang: locale,
            currencyTicker: fiatCurrency.ticker,
          }}
          onStateChange={onStateChange}
          ref={webviewAPIRef}
          customHandlers={customHandlers as never}
          hideLoader
        />
      </SwapWebAppWrapper>
    </>
  );
};

export default SwapWebView;

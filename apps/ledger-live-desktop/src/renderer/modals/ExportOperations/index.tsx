import { ipcRenderer } from "electron";
import React, { memo, useState, useCallback } from "react";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import styled from "styled-components";
import moment from "moment";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { accountsOpToCSV } from "@ledgerhq/live-common/csvExport";
import { Account } from "@ledgerhq/types-live";
import { Currency } from "@ledgerhq/types-cryptoassets";
import logger from "~/renderer/logger";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { activeAccountsSelector } from "~/renderer/reducers/accounts";
import { closeModal } from "~/renderer/actions/modals";
import { colors } from "~/renderer/styles/theme";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import AccountsList from "~/renderer/components/AccountsList";
import IconDownloadCloud from "~/renderer/icons/DownloadCloud";
import IconCheckCircle from "~/renderer/icons/CheckCircle";
import Alert from "~/renderer/components/Alert";
import { ModalData } from "../types";
import { State } from "~/renderer/reducers";
import { confirmationsNbForCurrencySelector } from "~/renderer/reducers/settings";

type OwnProps = {};
type Props = OwnProps & {
  closeModal: (a: keyof ModalData) => void;
  accounts: Account[];
  countervalueCurrency?: Currency;
  confirmationsNbCurrencies: Array<{ id: string; value: number }>;
};

const mapStateToProps = (state: State) => {
  const accounts = activeAccountsSelector(state);
  const countervalueCurrency = counterValueCurrencySelector(state);
  console.log("test", accounts);
  const currencies = accounts.map(account => account.currency);
  const confirmationsNbCurrencies = currencies.map(currency => ({
    id: currency.id,
    value: confirmationsNbForCurrencySelector(state, {
      currency: currency,
    }),
  }));
  return {
    accounts,
    countervalueCurrency,
    confirmationsNbCurrencies,
  };
};

/*
const mapStateToProps = createStructuredSelector({
  accounts: activeAccountsSelector,
  countervalueCurrency: counterValueCurrencySelector,
});*/

const mapDispatchToProps = {
  closeModal,
};
const exportOperations = async (
  path: Electron.SaveDialogReturnValue,
  csv: string,
  callback?: () => void,
) => {
  try {
    const res = await ipcRenderer.invoke("export-operations", path, csv);
    if (res && callback) {
      callback();
    }
  } catch (error) {
    // ignore
  }
};
function ExportOperations({
  accounts,
  closeModal,
  countervalueCurrency,
  confirmationsNbCurrencies,
}: Props) {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const countervalueState = useCountervaluesState();
  const exportCsv = useCallback(async () => {
    const path = await ipcRenderer.invoke("show-save-dialog", {
      title: "Exported account transactions",
      defaultPath: `ledgerlive-operations-${moment().format("YYYY.MM.DD")}.csv`,
      filters: [
        {
          name: "All Files",
          extensions: ["csv"],
        },
      ],
    });
    if (path) {
      exportOperations(
        path,
        accountsOpToCSV(
          accounts.filter(account => checkedIds.includes(account.id)),
          countervalueCurrency,
          countervalueState,
          confirmationsNbCurrencies,
        ),
        () => {
          setSuccess(true);
        },
      );
    }
  }, [accounts, checkedIds, countervalueCurrency, countervalueState, confirmationsNbCurrencies]);
  const onClose = useCallback(() => closeModal("MODAL_EXPORT_OPERATIONS"), [closeModal]);
  const handleButtonClick = useCallback(() => {
    let exporting = false;
    if (success) {
      onClose();
    } else {
      if (exporting) return;
      exporting = true;
      exportCsv()
        .catch(e => {
          logger.critical(e);
        })
        .then(() => {
          exporting = false;
        });
    }
  }, [exportCsv, onClose, success]);
  const handleSelectAll = useCallback((accounts: Account[]) => {
    setCheckedIds(accounts.map(a => a.id));
  }, []);
  const handleUnselectAll = useCallback(() => {
    setCheckedIds([]);
  }, []);
  const toggleAccount = useCallback((account: Account) => {
    setCheckedIds(prevState => {
      if (prevState.includes(account.id)) {
        return [...prevState].filter(id => id !== account.id);
      }
      return [...prevState, account.id];
    });
  }, []);
  const onHide = useCallback(() => {
    setSuccess(false);
    setCheckedIds([]);
  }, []);
  return (
    <Modal name="MODAL_EXPORT_OPERATIONS" centered onHide={onHide}>
      <ModalBody
        onClose={onClose}
        title={<Trans i18nKey="exportOperationsModal.title" />}
        render={() =>
          success ? (
            <Box>
              <IconWrapper>
                <IconCheckCircle size={43} />
              </IconWrapper>
              <Title>
                <Trans i18nKey="exportOperationsModal.titleSuccess" />
              </Title>
              <LabelWrapper ff="Inter|Regular">
                <Trans i18nKey="exportOperationsModal.descSuccess" />
              </LabelWrapper>
            </Box>
          ) : (
            <Box>
              <IconWrapperCircle>
                <IconDownloadCloud size={30} />
              </IconWrapperCircle>
              <LabelWrapper mb={2} ff="Inter|Regular">
                <Trans i18nKey="exportOperationsModal.desc" />
              </LabelWrapper>
              <Alert type="warning">
                <Trans i18nKey="exportOperationsModal.disclaimer" />
              </Alert>
              <AccountsList
                emptyText={<Trans i18nKey="exportOperationsModal.noAccounts" />}
                title={
                  <>
                    <Trans i18nKey="exportOperationsModal.selectedAccounts" />
                    {checkedIds.length > 0 ? ` (${checkedIds.length})` : ""}
                  </>
                }
                accounts={accounts}
                onSelectAll={accounts.length > 1 ? handleSelectAll : undefined}
                onUnselectAll={accounts.length > 1 ? handleUnselectAll : undefined}
                onToggleAccount={toggleAccount}
                checkedIds={checkedIds}
              />
            </Box>
          )
        }
        renderFooter={() => (
          <Box horizontal justifyContent="flex-end">
            <Button
              disabled={!success && !checkedIds.length}
              onClick={handleButtonClick}
              event={!success ? "Operation history" : undefined}
              data-test-id="export-operations-save-button"
              primary
            >
              {success ? (
                <Trans i18nKey="exportOperationsModal.ctaSuccess" />
              ) : (
                <Trans i18nKey="exportOperationsModal.cta" />
              )}
            </Button>
          </Box>
        )}
      />
    </Modal>
  );
}
const LabelWrapper = styled(Box)`
  text-align: center;
  font-size: 13px;
  font-family: "Inter";
  font-weight:;
`;
const IconWrapperCircle = styled(Box)<{ green?: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => (props.green ? "#66be5419" : "#8a80db19")};
  color: ${props => (props.green ? "#66be54" : "#8a80db")};
  align-items: center;
  justify-content: center;
  align-self: center;
  margin-bottom: 15px;
`;
const IconWrapper = styled(Box)`
  color: ${() => colors.positiveGreen};
  align-self: center;
  margin-bottom: 15px;
`;
const Title = styled(Box).attrs(() => ({
  ff: "Inter",
  fontSize: 5,
  mt: 2,
  mb: 15,
  color: "palette.text.shade100",
}))`
  text-align: center;
`;
const ConnectedExportOperations: React.ComponentType<OwnProps> = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ExportOperations);

export default memo(ConnectedExportOperations);

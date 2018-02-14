// @flow

import React, { PureComponent, Fragment } from 'react'
import { compose } from 'redux'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

import chunk from 'lodash/chunk'
import get from 'lodash/get'
import random from 'lodash/random'
import sortBy from 'lodash/sortBy'
import takeRight from 'lodash/takeRight'

import type { MapStateToProps } from 'react-redux'
import type { Accounts, T } from 'types/common'

import { space } from 'styles/theme'

import { getVisibleAccounts } from 'reducers/accounts'
import { getOrderAccounts } from 'reducers/settings'

import { updateOrderAccounts } from 'actions/accounts'
import { saveSettings } from 'actions/settings'

import { AreaChart } from 'components/base/Chart'
import Box, { Card } from 'components/base/Box'
import Pills from 'components/base/Pills'
import Text from 'components/base/Text'
import TransactionsList from 'components/TransactionsList'
import DropDown from 'components/base/DropDown'

import AccountCard from './AccountCard'
import BalanceInfos from './BalanceInfos'

const mapStateToProps: MapStateToProps<*, *, *> = state => ({
  accounts: getVisibleAccounts(state),
  orderAccounts: getOrderAccounts(state),
})

const mapDispatchToProps = {
  push,
  updateOrderAccounts,
  saveSettings,
}

type Props = {
  accounts: Accounts,
  push: Function,
  t: T,
  updateOrderAccounts: Function,
  saveSettings: Function,
  orderAccounts: string,
}

type State = {
  fakeDatas: Array<any>,
  selectedTime: string,
}

const ACCOUNTS_BY_LINE = 3
const TIMEOUT_REFRESH_DATAS = 5e3

const itemsTimes = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

const generateFakeData = v => ({
  name: `Day ${v}`,
  value: random(10, 100),
})

const generateFakeDatas = accounts =>
  accounts.map(() => [...Array(25).keys()].map(v => generateFakeData(v + 1)))

const getAllTransactions = accounts => {
  const allTransactions = accounts.reduce((result, account) => {
    const transactions = get(account, 'data.transactions', [])

    result = [
      ...result,
      ...transactions.map(t => ({
        ...t,
        account: {
          id: account.id,
          name: account.name,
          type: account.type,
        },
      })),
    ]

    return result
  }, [])

  return sortBy(allTransactions, t => t.received_at).reverse()
}

class DashboardPage extends PureComponent<Props, State> {
  state = {
    selectedTime: 'day',
    fakeDatas: generateFakeDatas(this.props.accounts),
  }

  componentDidMount() {
    this.addFakeDatasOnAccounts()
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.state.fakeDatas.length === 0 &&
      nextProps.accounts.length !== this.props.accounts.length
    ) {
      this.setState({
        fakeDatas: generateFakeDatas(nextProps.accounts),
      })
    }
  }

  componentWillUnmount() {
    clearTimeout(this._timeout)
  }

  getAccountsChunk() {
    const { accounts } = this.props

    // create shallow copy of accounts, to be mutated
    const listAccounts = [...accounts]

    while (listAccounts.length % ACCOUNTS_BY_LINE !== 0) listAccounts.push(null)

    return chunk(listAccounts, ACCOUNTS_BY_LINE)
  }

  setAccountOrder = order => {
    const { updateOrderAccounts, saveSettings } = this.props
    updateOrderAccounts(order)
    saveSettings({ orderAccounts: order })
  }

  addFakeDatasOnAccounts = () => {
    const { accounts } = this.props

    this._timeout = setTimeout(() => {
      window.requestAnimationFrame(() => {
        this.setState(prev => ({
          fakeDatas: [
            ...accounts.reduce((res, acc, i) => {
              if (res[i]) {
                const nextIndex = res[i].length
                res[i][nextIndex] = generateFakeData(nextIndex)
              }
              return res
            }, prev.fakeDatas),
          ],
        }))
      }, TIMEOUT_REFRESH_DATAS)
    })
  }

  _timeout = undefined

  render() {
    const { push, accounts, t, orderAccounts } = this.props
    const { selectedTime, fakeDatas } = this.state

    const totalAccounts = accounts.length

    const sortItems = [
      {
        key: 'name',
        label: t('orderAccounts.name'),
      },
      {
        key: 'balance',
        label: t('orderAccounts.balance'),
      },
      {
        key: 'type',
        label: t('orderAccounts.type'),
      },
    ]

    return (
      <Box flow={7}>
        <Box horizontal align="flex-end">
          <Box>
            <Text color="dark" ff="Museo Sans" fontSize={7}>
              {'Good morning, Khalil.'}
            </Text>
            <Text color="grey" fontSize={5} ff="Museo Sans|Light">
              {totalAccounts > 0
                ? `here is the summary of your ${totalAccounts} accounts`
                : 'no accounts'}
            </Text>
          </Box>
          <Box ml="auto">
            <Pills
              items={itemsTimes}
              activeKey={selectedTime}
              onChange={item => this.setState({ selectedTime: item.key })}
            />
          </Box>
        </Box>
        {totalAccounts > 0 && (
          <Fragment>
            <Card flow={3} p={0} py={6}>
              <Box px={6}>
                <BalanceInfos since={selectedTime} />
              </Box>
              <Box ff="Open Sans" fontSize={4} color="warmGrey">
                <AreaChart
                  id="dashboard-chart"
                  margin={{
                    top: space[6],
                    bottom: 0,
                    left: space[6] - 10,
                    right: space[6],
                  }}
                  color="#5286f7"
                  height={250}
                  data={takeRight(
                    fakeDatas.reduce((res, data) => {
                      data.forEach((d, i) => {
                        res[i] = {
                          name: d.name,
                          value: (res[i] ? res[i].value : 0) + d.value,
                        }
                      })
                      return res
                    }, []),
                    25,
                  )}
                />
              </Box>
            </Card>
            <Box flow={4}>
              <Box horizontal align="flex-end">
                <Text color="dark" ff="Museo Sans" fontSize={6}>
                  {'Accounts'}
                </Text>
                <Box ml="auto" horizontal flow={1}>
                  <Text ff="Open Sans|SemiBold" fontSize={4}>
                    {'Sort by'}
                  </Text>
                  <DropDown
                    onChange={item => this.setAccountOrder(item.key)}
                    items={sortItems}
                    ff="Open Sans|SemiBold"
                    fontSize={4}
                  >
                    <Text color="dark">{t(`orderAccounts.${orderAccounts}`)}</Text>
                  </DropDown>
                </Box>
              </Box>
              <Box flow={5}>
                {this.getAccountsChunk().map((accountsByLine, i) => (
                  <Box
                    key={i} // eslint-disable-line react/no-array-index-key
                    horizontal
                    flow={5}
                  >
                    {accountsByLine.map(
                      (account: any, j) =>
                        account === null ? (
                          <Box
                            key={j} // eslint-disable-line react/no-array-index-key
                            p={4}
                            flex={1}
                          />
                        ) : (
                          <AccountCard
                            key={account.id}
                            account={account}
                            data={takeRight(fakeDatas[j], 25)}
                            onClick={() => push(`/account/${account.id}`)}
                          />
                        ),
                    )}
                  </Box>
                ))}
              </Box>
              <Card p={0} px={4} title="Recent activity">
                <TransactionsList withAccounts transactions={getAllTransactions(accounts)} />
              </Card>
            </Box>
          </Fragment>
        )}
      </Box>
    )
  }
}

export default compose(connect(mapStateToProps, mapDispatchToProps), translate())(DashboardPage)

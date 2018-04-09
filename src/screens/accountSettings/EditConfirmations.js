/* @flow */
import React, { Component } from "react";
import { connect } from "react-redux";
import { View, TextInput } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/wallet-common/lib/types";

import SectionEntry from "../../components/SectionEntry";
import LText from "../../components/LText";
import { updateAccount } from "../../actions/accounts";

const mapStateToProps = () => ({});
const mapDispatchToProps = {
  updateAccount
};

class EditConfirmations extends Component<{
  navigation: NavigationScreenProp<{
    params: {
      account: Account
    }
  }>,
  updateAccount: ($Shape<Account>) => *
}> {
  static navigationOptions = {
    title: "Confirmations"
  };
  onConfNumEndEditing = (e: *) => {
    const { account } = this.props.navigation.state.params;
    if (e.nativeEvent.text.length) {
      this.props.updateAccount({
        minConfirmations: parseInt(e.nativeEvent.text, 10),
        id: account.id
      });
    }
    const { navigation } = this.props;
    navigation.goBack();
  };

  render() {
    const { account } = this.props.navigation.state.params;
    return (
      <View>
        <SectionEntry>
          <LText>Required Confirmations</LText>
          <TextInput
            keyboardType="numeric"
            placeholder="#"
            autoFocus
            underlineColorAndroid="transparent"
            returnKeyType="done"
            onEndEditing={this.onConfNumEndEditing}
            defaultValue={`${account.minConfirmations}`}
          />
        </SectionEntry>
      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditConfirmations);

import * as React from 'react';
import { SystemView as View, Text, Button, Spinner, Card } from 'nativesystem';
// Can also import methods as named exports
import { fetch } from 'ixortalk-client';

class Home extends React.Component {
  state = {
    pending: false,
    assets: null,
  };

  fetchAssets = async () => {
    this.setState({ pending: true });
    const response = await fetch('/assetmgmt/assets');
    const {
      _embedded: { assets },
    } = await response.json();
    this.setState({
      assets,
      pending: false,
    });
  };

  render() {
    const user = this.props.user;
    return (
      <View px={4} f={1} jc="center">
        <View f={1} jc="center">
          <Text>You are logged in.</Text>
          <Text>
            Welcome,{' '}
            <Text bold>
              {user.userInfo.firstName} {user.userInfo.lastName}
            </Text>!
          </Text>
          <View py={1}>
            <Button onPress={this.fetchAssets}>
              <Text color="white">Fetch Assets</Text>
            </Button>
          </View>

          {this.state.pending && (
            <View py={1}>
              <Spinner color="ufoGreen" />
            </View>
          )}
          {this.state.assets && (
            <Card color="white" raised={10} px={3} py={2} my={2}>
              {this.state.assets.map(asset => (
                <View>
                  <Text>{asset.assetProperties.properties.assetId}</Text>
                </View>
              ))}
            </Card>
          )}
        </View>

        <View mt={2}>
          <Button raised={10} color="ufoGreen" onPress={this.props.logOut}>
            <Text color="white">Log Out</Text>
          </Button>
        </View>
      </View>
    );
  }
}

export { Home };

import * as React from 'react';
import { Constants } from 'expo';
import g, { ThemeProvider } from 'glamorous-native';
import {
  SystemView as View,
  Button,
  createTheme,
  Screen,
  Text,
  Spinner,
  backgroundColor,
  createSubTheme,
} from 'nativesystem';
import client from 'ixortalk-client';

import { LogIn } from './LogIn';
import { Home } from './Home';

const ixortalkConfig = {
  baseUrl: 'https://www.demo-ixortalk.com',
  clientId: 'ixortalkOAuthClient',
  clientSecret: 'ixortalkOAuthClientSecret',
};

const theme = createTheme()
  .useDefault()
  .withSubTheme(
    'card',
    createSubTheme({borderRadius: 10}).done()
  )
  .done();

const BGView = g(View)(backgroundColor);

export default class App extends React.Component {
  state = {
    error: null,
    pending: true,
    user: null,
  };

  authChangeSub = null;

  componentDidMount() {
    client.initialize(ixortalkConfig);
    this.authChangeSub = client.onAuthChange(this.onAuthChange);
  }

  componentWillUnmount() {
    // Unsub when unmounting to avoid leaks
    this.authChangeSub.remove();
  }

  onAuthChange = user => {
    return this.setState({ user, pending: false });
  };

  logIn = async ({ email, password }) => {
    try {
      this.setState({ pending: true, error: null });
      await client.logIn({ email, password });
    } catch (e) {
      this.setState({ pending: false, error: e });
    }
  };

  logOut = async () => {
    this.setState({ pending: true });
    await client.logOut();
  };

  render() {
    const { pending, user, error } = this.state;
    return (
      <ThemeProvider theme={theme}>
        <Screen color="white" jc="center" f={1}>
          {error && (
            <BGView
              color="error"
              py={2}
              mt={Constants.statusBarHeight}
              ai="center">
              <Text bold color="white" align="center">
                Encountered an error
              </Text>
            </BGView>
          )}
          <View f={1} jc="center" py={3}>
            {pending ? (
              // Awaiting auth state
              <Spinner color="ufoGreen" size="large" />
            ) : user ? (
              // User is logged in, render home component
              <Home logOut={this.logOut} user={this.state.user} />
            ) : (
              // User is not logged in, render login component
              <LogIn logIn={this.logIn} />
            )}
          </View>
        </Screen>
      </ThemeProvider>
    );
  }
}

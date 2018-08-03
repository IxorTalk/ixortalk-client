import * as React from 'react';
import { SystemView as View, Button, Text } from 'nativesystem';

const email = 'demo@ixortalk.com';
const password = 'demo';

const LogIn = props => {
  return (
    <View px={4}>
      <Text>You are not logged in.</Text>
      <View my={2}>
        <Button
          raised={10}
          color="ufoGreen"
          onPress={() => props.logIn({ email, password })}>
          <Text color="white">Log In</Text>
        </Button>
      </View>
      <Text modifier="small">
        used credentials:
        <Text bold modifier="small">
          {email}/{password}
        </Text>
      </Text>
    </View>
  );
};

export { LogIn };

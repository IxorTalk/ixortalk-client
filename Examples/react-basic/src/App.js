import React, {Component} from 'react'
import client from 'ixortalk-client'
import {Button, Card, Heading, P, Screen} from './Components'


class App extends Component {
  state = {
    pending: true,
    user: null,
  }
  
  email = 'demo@ixortalk.com'
  password = 'demo'
  
  componentDidMount() {
    client.initialize({
      baseUrl: 'https://www.demo-ixortalk.com',
      clientId: 'ixortalk-mobile-client',
      clientSecret: 'Bfg9NLcDWkfZgHtY',
    })
    client.onAuthChange(this.onAuthChange)
  }
  
  onAuthChange = (user) =>
    this.setState({user, pending: false})
  
  logIn = async () => {
    try {
      this.setState({pending: true})
      await client.logIn({email: this.email, password: this.password})
    }
    catch(e) {
      this.setState({pending: false})
    }
  }
  logOut = async () => {
    try {
      this.setState({pending: true})
      await client.logOut()
    }
    catch(e) {
      this.setState({pending: false})
    }
  }
  
  render() {
    const {pending, user} = this.state
    return (
      <Screen>
        <Card>
          {
            pending ?
              <Heading>
                Loading...
              </Heading> :
              
              user ?
                <div>
                  <Heading>
                    Welcome, {user.userInfo.firstName} {user.userInfo.lastName}
                  </Heading>
                  <Button onClick={this.logOut}>
                    <P>Log Out</P>
                  </Button>
                </div> :
                
                <div>
                  <Heading>
                    You aren't logged in.
                  </Heading>
                  <Button onClick={this.logIn}>
                    <P color="white">Log In</P>
                  </Button>
                  <P>
                    Using credentials <b>{this.email} / {this.password}</b>
                  </P>
                </div>
          }
        </Card>
      </Screen>
    )
  }
}

export default App

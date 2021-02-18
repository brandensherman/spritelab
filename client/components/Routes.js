import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Home from './Home';
import Canvas from './Canvas';
import CreateArtboard from './CreateArtboard';

import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';

class Routes extends Component {
  render() {
    return (
      <Router>
        <Route exact path='/' component={Home} />
        <Route exact path='/canvas' component={Canvas} />
        <Route exact path='/create' component={CreateArtboard} />
        <Route exact path='/profile' component={ProfileScreen} />
        <Route exact path='/register' component={RegisterScreen} />
        <Route exact path='/login' component={LoginScreen} />
      </Router>
    );
  }
}

export default Routes;

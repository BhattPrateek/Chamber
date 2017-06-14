import React from 'react';
import { render } from 'react-dom';

// Import css
// import css from './styles/style.styl';

// Import Components
import App from './components/App.jsx';
import Homepage from './components/Homepage.jsx';
import BeatsList from './components/BeatsList.jsx';
import Beat from './components/Beat.jsx';
import AppWithAxios from './components/AppWithAxios.jsx';
import Profile from './components/Profile.jsx';
import Container from './components/Container.jsx';
import SongDisplay from './components/SongDisplay.jsx';
import Uploads from './components/Uploads.jsx';
import Tournaments from './components/Tournaments.jsx';
import SongComponent from './components/SongComponent.jsx';
// import react router deps
import { Router, Route, IndexRoute, browserHistory, hashHistory } from 'react-router';
import { Provider } from 'react-redux';
import store, { history } from './store';
import MyProfile from './components/MyProfile.jsx';

const router = (
  <Provider store={store}>
    <Router history={browserHistory}>
      <Route path="/" component={Container}>
        <IndexRoute component={AppWithAxios}></IndexRoute>
        <Route path="/song" component={SongDisplay}></Route>
        <Route path="/myProfile" component={MyProfile}></Route>
        <Route path="/profile/:user_id" component={Profile}></Route>
        <Route path="/upload" component={Uploads}></Route>
        <Route path="/tournaments" component={Tournaments}></Route>
        <Route path="/singleSong/:songname" component={SongComponent}></Route>
      </Route>
    </Router>
  </Provider>
)

render(router, document.getElementById('root'));

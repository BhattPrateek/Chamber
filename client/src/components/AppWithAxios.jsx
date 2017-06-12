import React from 'react';
import axios from 'axios';
import SongList from './SongList.jsx';
import Profile from './Profile.jsx';
import Header from './Header.jsx';
<<<<<<< HEAD
import { Link } from 'react-router';
import Tag from './Tag.jsx'
=======
import {Bracket} from 'react-tournament-bracket';
>>>>>>> (feat) add tournament functionality

class AppWithAxios extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      topBeats: [],
      topCollabs: [],
      newSongs: [],
      pageToDisplay: 'Profile'
    }
    this.getTopSongs = this.getTopSongs.bind(this);
    this.getTopCollabs = this.getTopCollabs.bind(this);
    this.getNewSongs = this.getNewSongs.bind(this);
    this.handleDisplayChange = this.handleDisplayChange.bind(this);
  }

  componentDidMount() {
    this.getTopSongs();
    this.getTopCollabs();
    this.getNewSongs();
  }

  getTopSongs() {
    axios.get('/api/topBeats')
      .then((results) => {
        this.setState({
          topBeats: results.data
        })
      })
      .catch((error) => {
        console.log('Error! getSongs on AppWithAxios.jsx', error);
      })
  }

  getTopCollabs() {
    axios.get('/api/topCollabs')
      .then((results) => { 
        this.setState({
          topCollabs: results.data
        })
      })
      .catch((error) => {
        console.log('Error! getSongs on AppWithAxios.jsx', error);
      })
  }

    getNewSongs() {
    axios.get('/api/newSongs')
      .then((results) => { 
        this.setState({
          newSongs: results.data
        })
      })
      .catch((error) => {
        console.log('Error! getSongs on AppWithAxios.jsx', error);
      })
  }
  

  handleDisplayChange() {
    let display = this.state.pageToDisplay;
    if (display === 'SongList') {
      this.setState({pageToDisplay : 'Profile'});
    } else if (display === 'Profile') {
      this.setState({pageToDisplay: 'SongList'})
    }
  }

  render() {
    let PageToDisplay = SongList;
    let display = this.state.pageToDisplay;
    if (display === 'Profile') {
      PageToDisplay = Profile;
    } else if (display === 'SongList') {
      PageToDisplay = SongList;
    }

    return (
<<<<<<< HEAD
      
      <div>  
        <div className="jumbotron jumboPic"></div>         
        <Tag newSongs={this.state.newSongs} topBeats={this.state.topBeats} topCollabs={this.state.topCollabs}/>
=======
      <div>
        <Header/>
        <Bracket game={{name: 'nik', scheduled: 8, sides: {name: 'john'}}}/>
        <div className='container-fluid'>
          <button 
            className='btn btn-danger pull-right' 
            onClick={this.handleDisplayChange}>
            Upload Song
          </button>
         </div>
         <PageToDisplay songs={this.state.songs}/>
>>>>>>> (feat) add tournament functionality
      </div>
    )
  }
}

export default AppWithAxios;

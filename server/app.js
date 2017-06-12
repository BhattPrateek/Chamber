'use strict';
const express = require('express');
const path = require('path');
const middleware = require('./middleware');
const routes = require('./routes');
var AWS = require('aws-sdk');
var multer = require('multer');
var fs = require('fs');
const url = require('url');
var File = require('file');
var cors = require('cors');
var db = require('../db/index.js');
const knex = require('knex')(require('../knexfile.js'));


const app = express();

app.use(middleware.morgan('dev'));
app.use(middleware.cookieParser());
app.use(middleware.bodyParser.urlencoded({extended: false}));
app.use(middleware.bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(middleware.auth.session);
app.use(middleware.passport.initialize());
app.use(middleware.passport.session());
app.use(middleware.flash());

app.use(express.static(path.join(__dirname, '../public')));

AWS.config.update(
  {
    accessKeyId: 'AKIAINTNVRLUHO6R3HSQ',
    secretAccessKey: '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',
    // region: 'us-west-2'
  });
  
const s3 = new AWS.S3({region: 'us-west-2'});

const upload = multer({
  storage: multer.memoryStorage(),
  // file size limitation in bytes
  limits: { fileSize: 524288000 },
});

app.use('/', routes.auth);
app.use('/api', routes.api);
app.use('/api/profiles', routes.profiles);
app.use('/api/topBeats', routes.topBeats);
app.use('/api/topCollabs', routes.topCollabs);
app.use('/api/newSongs', routes.newSongs);
app.use('/api/voteClick', routes.voteClick);
app.use('/api/comment', routes.commentClick);
app.use('/api/commentRender', routes.commentRender);



app.post('/upload', upload.single('theseNamesMustMatch'), (req, res) => {
  // req.file is the 'theseNamesMustMatch' file
  console.log(req.file);
  var params = {
    Bucket: 'elasticsongstalk', 
    Body: req.file.buffer,
    Key: req.file.originalname,
    ACL: 'public-read-write', // your permisions 
  };
  s3.upload(params, (err, data) => {
    if(err){
      console.log("ERRRORORR", err);
      res.status(500).send("We messed up in s3 upload.");
    // }else{
    //   res.status(200).send("s3 upload was succexful")
    // }
    }else{
      knex('submissions').insert({name: req.file.originalname, profiles_id: req.user.id, type: 'beat', tempo: 98, link: data.Location})
      .then(()=>{
        console.log("DB UPDATED");
        res.status(200).send("Database updated!");
      })
      .catch((err)=>{
        console.log("DB FAILED", err);
        res.status(500).send("Database update failed!");
      });
    }
  });
});

app.get('/loginInfo', (req, res) => {
  console.log(req.user);
  res.send(req.user);
});

app.get('/userSongs', (req, res) => {
  // db.getSingleUserSongs(req.user.id, (err, results)=>{
  //   if(err){
  //     res.send("Error getting single user data", err);
  //   }
  //   res.status(200).send("We got the da")
  // })
  knex('submissions').where({profiles_id: req.user.id})
        .then((response) => {
            // console.log(response)
            console.log("Getting user DATA!!", response);
            res.status(200).send(response);
        })
        .catch((error) => {
            console.log("Getting single user data failed!", error)
            res.status(500).send("Database update failed!");
        })
});

// app.get('/api/songs', function (req, res) {
//   knex.select().table('submissions')
//   .then((songs)=>{
//     res.send(songs);
//   })
//   .catch((err)=>{
//     console.log(err);
//   });
// });
app.post('/uploadround1', upload.single('theseNamesMustMatch'), (req, res) => {
  // req.file is the 'theseNamesMustMatch' file
  console.log(req.file);
  var params = {
    Bucket: 'elasticsongstalk', 
    Body: req.file.buffer,
    Key: req.file.originalname,
    ACL: 'public-read-write', // your permisions 
  };
  s3.upload(params, (err, data) => {
    if(err){
      console.log("ERRRORORR", err);
      res.status(500).send("We messed up in s3 upload.");
    // }else{
    //   res.status(200).send("s3 upload was succexful")
    // }
    }else{
      knex('submissions').insert({name: req.file.originalname, profiles_id: req.user.id, type: 'beat', tempo: 98, link: data.Location})
      .then((response)=>{
        // console.log("DB UPDATED NIK YA DONE DID IT BABY", response);
        knex('submissions').select('id').where({name: req.file.originalname})
          .then((id) => {
            knex('round1').where({'id': 1}).update({'name': 'placeholder', 'round1_beat': id[0].id})
              .then(() => {
                console.log('did it')
              })
              .catch((error) => {
                console.log(error)
              })
          })
        res.status(200).send("Database updated!");
      })
      .catch((err)=>{
        console.log("DB FAILED", err);
        res.status(500).send("Database update failed!");
      });
    }
  });
});

app.post('/competitorUpload', upload.single('theseNamesMustMatch'), (req, res) => {
  // req.file is the 'theseNamesMustMatch' file
  var profileArray =[];
  console.log(req.file);
  var params = {
    Bucket: 'elasticsongstalk', 
    Body: req.file.buffer,
    Key: req.file.originalname,
    ACL: 'public-read-write', // your permisions 
  };
  knex.select().table('matchup')
    .then((response) => {
      for(var i = 0;i < response.length;i++) {
        profileArray.push(response[i].prof_id1)
      }
      for(var i = 0;i < response.length;i++) {
        profileArray.push(response[i].prof_id2)
      }
    })
  s3.upload(params, (err, data) => {
    if(err){
      console.log("ERRRORORR", err);
      res.status(500).send("We messed up in s3 upload.");
    // }else{
    //   res.status(200).send("s3 upload was succexful")
    // }
    } else if (req.user.id in profileArray){
      knex('submissions').insert({name: req.file.originalname, profiles_id: req.user.id, type: 'beat', tempo: 98, link: data.Location})
      .then((response)=>{
        // console.log("DB UPDATED NIK YA DONE DID IT BABY", response);
        knex('submissions').select('id').where({name: req.file.originalname, profiles_id: req.user.id})
          .then((id) => {
            knex('matchup').where({'prof_id2': req.user.id}).update({'song_id2': id[0].id})
              .then(() => {
                knex('likes').insert({'profiles_id': req.user.id, 'submission_id': id[0].id})
                  .then(() => console.log('we done did it baby'))
              })
            knex('matchup').where({'prof_id1': req.user.id}).update({'song_id1': id[0].id})
              .then(() => {
                knex('likes').insert({'profiles_id': req.user.id, 'submission_id': id[0].id})
                  .then(() => console.log('we done did it baby'))
              })
              .catch((error) => {
                console.log(error)
              })
          })
        res.status(200).send("Database updated!");
      }) 
      .catch((err)=>{
        console.log("DB FAILED", err);
        res.status(500).send("Database update failed!");
      });
    } else {
        res.status(500).send('not a competitor uploading')
      }
  });
});

app.post('/uploadround2', upload.single('theseNamesMustMatch'), (req, res) => {
  // req.file is the 'theseNamesMustMatch' file
  console.log(req.file);
  var params = {
    Bucket: 'elasticsongstalk', 
    Body: req.file.buffer,
    Key: req.file.originalname,
    ACL: 'public-read-write', // your permisions 
  };
  s3.upload(params, (err, data) => {
    if(err){
      console.log("ERRRORORR", err);
      res.status(500).send("We messed up in s3 upload.");
    // }else{
    //   res.status(200).send("s3 upload was succexful")
    // }
    }else{
      knex('submissions').insert({name: req.file.originalname, profiles_id: req.user.id, type: 'beat', tempo: 98, link: data.Location})
      .then((response)=>{
        // console.log("DB UPDATED NIK YA DONE DID IT BABY", response);
        knex('submissions').select('id').where({name: req.file.originalname})
          .then((id) => {
            knex('round2').insert({'id': 1, 'name': 'placeholder', 'round2_beat': id[0].id})
              .then(() => {
                console.log('did it')
              })
              .catch((error) => {
                console.log(error)
              })
          })
        res.status(200).send("Database updated!");
      })
      .catch((err)=>{
        console.log("DB FAILED", err);
        res.status(500).send("Database update failed!");
      });
    }
  });
});

app.post('/uploadround3', upload.single('theseNamesMustMatch'), (req, res) => {
  // req.file is the 'theseNamesMustMatch' file
  console.log(req.file);
  var params = {
    Bucket: 'elasticsongstalk', 
    Body: req.file.buffer,
    Key: req.file.originalname,
    ACL: 'public-read-write', // your permisions 
  };
  s3.upload(params, (err, data) => {
    if(err){
      console.log("ERRRORORR", err);
      res.status(500).send("We messed up in s3 upload.");
    // }else{
    //   res.status(200).send("s3 upload was succexful")
    // }
    }else{
      knex('submissions').insert({name: req.file.originalname, profiles_id: req.user.id, type: 'beat', tempo: 98, link: data.Location})
      .then((response)=>{
        // console.log("DB UPDATED NIK YA DONE DID IT BABY", response);
        knex('submissions').select('id').where({name: req.file.originalname})
          .then((id) => {
            knex('round3').insert({'id': 1, 'name': 'placeholder', 'round3_beat': id[0].id})
              .then(() => {
                console.log('did it')
              })
              .catch((error) => {
                console.log(error)
              })
          })
        res.status(200).send("Database updated!");
      })
      .catch((err)=>{
        console.log("DB FAILED", err);
        res.status(500).send("Database update failed!");
      });
    }
  });
});

app.get('/round1matchup1', function (req, res) {
  var tournamentQuery = knex.table('tournaments').innerJoin('round1', 'tournaments.round1_id', '=', 'round1.id').select('*','tournaments.name as tournamentname').as('tournamentTable');
  var matchup1Query = knex(tournamentQuery).innerJoin('matchup', 'matchup.id', '=', 'tournamentTable.matchup_id1').as('matchup1Table');
  var matchup1Profile1Query = knex(matchup1Query).join('profiles', 'matchup1Table.prof_id1','=', 'profiles.id').select('*','profiles.display as profile1name').as('matchup1profile1Table');
  var profile1songQuery = knex(matchup1Profile1Query).join('submissions', 'submissions.id','=', 'matchup1profile1Table.song_id1').select('*','submissions.name as profile1songname', 'submissions.link as profile1songlink', 'submissions.id as profile1songid').as('profile1songTable');
  var matchup1Profile2Query = knex(profile1songQuery).join('profiles', 'profile1songTable.prof_id2','=', 'profiles.id').select('*','profiles.display as profile2name').as('matchup1profile2Table');
  var profile2songQuery = knex(matchup1Profile2Query).join('submissions', 'submissions.id','=', 'matchup1profile2Table.song_id2').select('*','submissions.name as profile2songname', 'submissions.link as profile2songlink', 'submissions.id as profile2songid').as('profile2songTable');
  knex(profile2songQuery).join('submissions', 'submissions.id', '=', 'profile2songTable.round1_beat').select('*', 'submissions.link as roundbeatlink', 'submissions.name as roundbeatname')
    .then((songs)=>{
        knex.count('submission_id as profile1votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id1})
          .then((prof1count) => {songs[0].profile1count = prof1count[0].profile1votecount;
              knex.count('submission_id as profile2votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id2})
                  .then((prof2count) => {
                      songs[0].profile2count = prof2count[0].profile2votecount;
                      res.send(songs)
                  })
                  .catch((error) => console.log(error))
          }
          )
    })
    .catch((err)=>{
      console.log(err);
    });
});

app.get('/round1matchup2', function (req, res) {
  var tournamentQuery = knex.table('tournaments').innerJoin('round1', 'tournaments.round1_id', '=', 'round1.id').select('*','tournaments.name as tournamentname').as('tournamentTable');
  var matchup1Query = knex(tournamentQuery).innerJoin('matchup', 'matchup.id', '=', 'tournamentTable.matchup_id2').as('matchup1Table');
  var matchup1Profile1Query = knex(matchup1Query).join('profiles', 'matchup1Table.prof_id1','=', 'profiles.id').select('*','profiles.display as profile1name').as('matchup1profile1Table');
  var profile1songQuery = knex(matchup1Profile1Query).join('submissions', 'submissions.id','=', 'matchup1profile1Table.song_id1').select('*','submissions.name as profile1songname', 'submissions.link as profile1songlink', 'submissions.id as profile1songid').as('profile1songTable');
  var matchup1Profile2Query = knex(profile1songQuery).join('profiles', 'profile1songTable.prof_id2','=', 'profiles.id').select('*','profiles.display as profile2name').as('matchup1profile2Table');
  var profile2songQuery = knex(matchup1Profile2Query).join('submissions', 'submissions.id','=', 'matchup1profile2Table.song_id2').select('*','submissions.name as profile2songname', 'submissions.link as profile2songlink', 'submissions.id as profile2songid').as('profile2songTable')
    .then((songs)=>{
        knex.count('submission_id as profile1votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id1})
          .then((prof1count) => {songs[0].profile1count = prof1count[0].profile1votecount;
              knex.count('submission_id as profile2votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id2})
                  .then((prof2count) => {
                      songs[0].profile2count = prof2count[0].profile2votecount;
                      res.send(songs)
                  })
                  .catch((error) => console.log(error))
          }
          )
    })
    .catch((err)=>{
      console.log(err);
    });
});

app.get('/round1matchup3', function (req, res) {
  var tournamentQuery = knex.table('tournaments').innerJoin('round1', 'tournaments.round1_id', '=', 'round1.id').select('*','tournaments.name as tournamentname').as('tournamentTable');
  var matchup1Query = knex(tournamentQuery).innerJoin('matchup', 'matchup.id', '=', 'tournamentTable.matchup_id3').as('matchup1Table');
  var matchup1Profile1Query = knex(matchup1Query).join('profiles', 'matchup1Table.prof_id1','=', 'profiles.id').select('*','profiles.display as profile1name').as('matchup1profile1Table');
  var profile1songQuery = knex(matchup1Profile1Query).join('submissions', 'submissions.id','=', 'matchup1profile1Table.song_id1').select('*','submissions.name as profile1songname', 'submissions.link as profile1songlink', 'submissions.id as profile1songid').as('profile1songTable');
  var matchup1Profile2Query = knex(profile1songQuery).join('profiles', 'profile1songTable.prof_id2','=', 'profiles.id').select('*','profiles.display as profile2name').as('matchup1profile2Table');
  var profile2songQuery = knex(matchup1Profile2Query).join('submissions', 'submissions.id','=', 'matchup1profile2Table.song_id2').select('*','submissions.name as profile2songname', 'submissions.link as profile2songlink', 'submissions.id as profile2songid').as('profile2songTable')
    .then((songs)=>{
        knex.count('submission_id as profile1votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id1})
          .then((prof1count) => {songs[0].profile1count = prof1count[0].profile1votecount;
              knex.count('submission_id as profile2votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id2})
                  .then((prof2count) => {
                      songs[0].profile2count = prof2count[0].profile2votecount;
                      res.send(songs)
                  })
                  .catch((error) => console.log(error))
          }
          )
    })
    .catch((err)=>{
      console.log(err);
    });
});

app.get('/currentuser', function(req, res) {
  res.send(req.user)
})

app.get('/round1matchup4', function (req, res) {
  var tournamentQuery = knex.table('tournaments').innerJoin('round1', 'tournaments.round1_id', '=', 'round1.id').select('*','tournaments.name as tournamentname').as('tournamentTable');
  var matchup1Query = knex(tournamentQuery).innerJoin('matchup', 'matchup.id', '=', 'tournamentTable.matchup_id4').as('matchup1Table');
  var matchup1Profile1Query = knex(matchup1Query).join('profiles', 'matchup1Table.prof_id1','=', 'profiles.id').select('*','profiles.display as profile1name').as('matchup1profile1Table');
  var profile1songQuery = knex(matchup1Profile1Query).join('submissions', 'submissions.id','=', 'matchup1profile1Table.song_id1').select('*','submissions.name as profile1songname', 'submissions.link as profile1songlink', 'submissions.id as profile1songid').as('profile1songTable');
  var matchup1Profile2Query = knex(profile1songQuery).join('profiles', 'profile1songTable.prof_id2','=', 'profiles.id').select('*','profiles.display as profile2name').as('matchup1profile2Table');
  var profile2songQuery = knex(matchup1Profile2Query).join('submissions', 'submissions.id','=', 'matchup1profile2Table.song_id2').select('*','submissions.name as profile2songname', 'submissions.link as profile2songlink', 'submissions.id as profile2songid').as('profile2songTable')
    .then((songs)=>{
        knex.count('submission_id as profile1votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id1})
          .then((prof1count) => {songs[0].profile1count = prof1count[0].profile1votecount;
              knex.count('submission_id as profile2votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id2})
                  .then((prof2count) => {
                      songs[0].profile2count = prof2count[0].profile2votecount;
                      res.send(songs)
                  })
                  .catch((error) => console.log(error))
          }
          )
    })
    .catch((err)=>{
      console.log(err);
    });
});

app.get('/round2matchup1', function (req, res) {
  var tournamentQuery = knex.table('tournaments').innerJoin('round2', 'tournaments.round2_id', '=', 'round2.id').select('*','tournaments.name as tournamentname').as('tournamentTable');
  var matchup1Query = knex(tournamentQuery).innerJoin('matchup', 'matchup.id', '=', 'tournamentTable.matchup_id1').as('matchup1Table');
  var matchup1Profile1Query = knex(matchup1Query).join('profiles', 'matchup1Table.prof_id1','=', 'profiles.id').select('*','profiles.display as profile1name').as('matchup1profile1Table');
  var profile1songQuery = knex(matchup1Profile1Query).join('submissions', 'submissions.id','=', 'matchup1profile1Table.song_id1').select('*','submissions.name as profile1songname', 'submissions.link as profile1songlink', 'submissions.id as profile1songid').as('profile1songTable');
  var matchup1Profile2Query = knex(profile1songQuery).join('profiles', 'profile1songTable.prof_id2','=', 'profiles.id').select('*','profiles.display as profile2name').as('matchup1profile2Table');
  var profile2songQuery = knex(matchup1Profile2Query).join('submissions', 'submissions.id','=', 'matchup1profile2Table.song_id2').select('*','submissions.name as profile2songname', 'submissions.link as profile2songlink', 'submissions.id as profile2songid').as('profile2songTable');
  knex(profile2songQuery).join('submissions', 'submissions.id', '=', 'profile2songTable.round2_beat').select('*', 'submissions.link as roundbeatlink', 'submissions.name as roundbeatname')
    .then((songs)=>{
        knex.count('submission_id as profile1votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id1})
          .then((prof1count) => {songs[0].profile1count = prof1count[0].profile1votecount;
              knex.count('submission_id as profile2votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id2})
                  .then((prof2count) => {
                      songs[0].profile2count = prof2count[0].profile2votecount;
                      res.send(songs)
                  })
                  .catch((error) => console.log(error))
          }
          )
    })
    .catch((err)=>{
      console.log(err);
    });
});

app.get('/round2matchup2', function (req, res) {
  var tournamentQuery = knex.table('tournaments').innerJoin('round2', 'tournaments.round2_id', '=', 'round2.id').select('*','tournaments.name as tournamentname').as('tournamentTable');
  var matchup1Query = knex(tournamentQuery).innerJoin('matchup', 'matchup.id', '=', 'tournamentTable.matchup_id2').as('matchup1Table');
  var matchup1Profile1Query = knex(matchup1Query).join('profiles', 'matchup1Table.prof_id1','=', 'profiles.id').select('*','profiles.display as profile1name').as('matchup1profile1Table');
  var profile1songQuery = knex(matchup1Profile1Query).join('submissions', 'submissions.id','=', 'matchup1profile1Table.song_id1').select('*','submissions.name as profile1songname', 'submissions.link as profile1songlink', 'submissions.id as profile1songid').as('profile1songTable');
  var matchup1Profile2Query = knex(profile1songQuery).join('profiles', 'profile1songTable.prof_id2','=', 'profiles.id').select('*','profiles.display as profile2name').as('matchup1profile2Table');
  var profile2songQuery = knex(matchup1Profile2Query).join('submissions', 'submissions.id','=', 'matchup1profile2Table.song_id2').select('*','submissions.name as profile2songname', 'submissions.link as profile2songlink', 'submissions.id as profile2songid').as('profile2songTable')
    .then((songs)=>{
        knex.count('submission_id as profile1votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id1})
          .then((prof1count) => {songs[0].profile1count = prof1count[0].profile1votecount;
              knex.count('submission_id as profile2votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id2})
                  .then((prof2count) => {
                      songs[0].profile2count = prof2count[0].profile2votecount;
                      res.send(songs)
                  })
                  .catch((error) => console.log(error))
          }
          )
    })
    .catch((err)=>{
      console.log(err);
    });
});

app.get('/round3matchup1', function (req, res) {
  var tournamentQuery = knex.table('tournaments').innerJoin('round3', 'tournaments.round3_id', '=', 'round3.id').select('*','tournaments.name as tournamentname').as('tournamentTable');
  var matchup1Query = knex(tournamentQuery).innerJoin('matchup', 'matchup.id', '=', 'tournamentTable.matchup_id1').as('matchup1Table');
  var matchup1Profile1Query = knex(matchup1Query).join('profiles', 'matchup1Table.prof_id1','=', 'profiles.id').select('*','profiles.display as profile1name').as('matchup1profile1Table');
  var profile1songQuery = knex(matchup1Profile1Query).join('submissions', 'submissions.id','=', 'matchup1profile1Table.song_id1').select('*','submissions.name as profile1songname', 'submissions.link as profile1songlink', 'submissions.id as profile1songid').as('profile1songTable');
  var matchup1Profile2Query = knex(profile1songQuery).join('profiles', 'profile1songTable.prof_id2','=', 'profiles.id').select('*','profiles.display as profile2name').as('matchup1profile2Table');
  var profile2songQuery = knex(matchup1Profile2Query).join('submissions', 'submissions.id','=', 'matchup1profile2Table.song_id2').select('*','submissions.name as profile2songname', 'submissions.link as profile2songlink', 'submissions.id as profile2songid').as('profile2songTable');
  knex(profile2songQuery).join('submissions', 'submissions.id', '=', 'profile2songTable.round3_beat').select('*', 'submissions.link as roundbeatlink', 'submissions.name as roundbeatname')
    .then((songs)=>{
        knex.count('submission_id as profile1votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id1})
          .then((prof1count) => {songs[0].profile1count = prof1count[0].profile1votecount;
              knex.count('submission_id as profile2votecount').groupBy('submission_id').from('likes').where({'submission_id': songs[0].song_id2})
                  .then((prof2count) => {
                      songs[0].profile2count = prof2count[0].profile2votecount;
                      res.send(songs)
                  })
                  .catch((error) => console.log(error))
          }
          )
    })
    .catch((err)=>{
      console.log(err);
    });
});

app.post('/submitTournament', function(req,res) {
  knex('matchup').del()
    .then(() => {
        knex.select('id').from('profiles').where({'display': req.body.competitor1})
        .then((first) => {
          knex.select('id').from('profiles').where({'display': req.body.competitor2})
            .then((second) => {
              knex('matchup').insert({'id': 1,'name': 'placeholder', 'prof_id1': first[0].id, 'prof_id2': second[0].id, 'song_id1': 1, 'song_id2': 1})
                .then(() => {
                    knex.select('id').from('profiles').where({'display': req.body.competitor3})
                      .then((first) => {
                        knex.select('id').from('profiles').where({'display': req.body.competitor4})
                          .then((second) => {
                            knex('matchup').insert({'id': 2,'name': 'placeholder', 'prof_id1': first[0].id, 'prof_id2': second[0].id, 'song_id1': 1, 'song_id2': 1})
                              .then(() => {
                                  knex.select('id').from('profiles').where({'display': req.body.competitor5})
                                    .then((first) => {
                                      knex.select('id').from('profiles').where({'display': req.body.competitor6})
                                        .then((second) => {
                                          knex('matchup').insert({'id': 3,'name': 'placeholder', 'prof_id1': first[0].id, 'prof_id2': second[0].id, 'song_id1': 1, 'song_id2': 1})
                                            .then(() => {
                                                knex.select('id').from('profiles').where({'display': req.body.competitor7})
                                                  .then((first) => {
                                                    knex.select('id').from('profiles').where({'display': req.body.competitor8})
                                                      .then((second) => {
                                                        knex('matchup').insert({'id': 4, 'name': 'placeholder', 'prof_id1': first[0].id, 'prof_id2': second[0].id, 'song_id1': 1, 'song_id2': 1})
                                                          .then(() => {
                                                              knex('round1').del()
                                                                .then(() => {
                                                                  knex('round1').insert({'id': 1,'name': 'placeholder','matchup_id1': 1, 'matchup_id2': 2, 'matchup_id3': 3, 'matchup_id4': 4, 'round1_beat': 1})
                                                                    .then(() => {
                                                                      knex('tournaments').del()
                                                                        .then(() => {
                                                                          knex('tournaments').insert({'id': 1, 'name': req.body.tournamentname, 'round1_id': 1, 'description': req.body.tournamentdescription})
                                                                            .then(() => {
                                                                                knex('round2').del()
                                                                                  .then(() => {
                                                                                    knex('round3').del()
                                                                                      .then(() => {
                                                                                        knex('likes').insert({'submission_id': 1})
                                                                                          .then(() => res.send('worked'))
                                                                                      }) 
                                                                                  })
                                                                            })
                                                                        })
                                                                    })
                                                                    .catch((error) => console.log(error))
                                                                })
                                                                .catch((error) => console.log(error))
                                                          })
                                                          .catch((error) => console.log(error))
                                                      })
                                                  })
                                            })
                                            .catch((error) => console.log(error))
                                        })
                                    })
                              })
                              .catch((error) => console.log(error))
                          })
                      })
                })
                .catch((error) => console.log(error))
            })
        })
  })
})

app.post('/insertRound21', function(req,res) {
  knex('matchup').insert({'id': 5, 'name': 'placeholder', 'prof_id1': req.body.profile_id, 'song_id1': 1})
    .then((result) => res.send('worked'))
    .catch((error) => console.log(error))
})

app.post('/insertRound22', function(req,res) {
  knex('matchup').where({'id': 5}).update({'prof_id2': req.body.profile_id, 'song_id2': 1})
    .then((result) => res.send('worked'))
    .catch((error) => console.log(error))
})

app.post('/insertRound23', function(req,res) {
  knex('matchup').insert({'id': 6, 'name': 'placeholder', 'prof_id1': req.body.profile_id, 'song_id1': 1})
    .then((result) => res.send('worked'))
    .catch((error) => console.log(error))
})

app.post('/insertRound24', function(req,res) {
  knex('matchup').where({'id': 6}).update({'prof_id2': req.body.profile_id, 'song_id2': 1})
    .then((result) => res.send('worked'))
    .catch((error) => console.log(error))
})

app.post('/round2post', function(req,res) {
  console.log('steve said put this here')
  knex('round2').where({'id': 1}).update({'matchup_id1': 5, 'matchup_id2': 6})
    .then(() => {
      console.log('we are in the first knex call')
      knex('tournaments').where({'id': 1}).update({'round2_id': 1})
        .then(() => res.send('worked'))
    })
    .catch((error) => console.log(error))
})

app.post('/insertRound31', function(req,res) {
  knex('matchup').insert({'id': 7, 'name': 'placeholder', 'prof_id1': req.body.profile_id, 'song_id1': 1})
    .then((result) => res.send('worked'))
    .catch((error) => console.log(error))
})

app.post('/insertRound32', function(req,res) {
  knex('matchup').where({'id': 7}).update({'prof_id2': req.body.profile_id, 'song_id2': 1})
    .then((result) => res.send('worked'))
    .catch((error) => console.log(error))
})

app.post('/round3post', function(req,res) {
  knex('round3').where({'id': 1}).update({'matchup_id1': 7})
    .then(() => {
      knex('tournaments').where({'id': 1}).update({'round3_id': 1})
        .then(() => res.send('worked'))
    })
    .catch((error) => console.log(error))
})

module.exports = app;

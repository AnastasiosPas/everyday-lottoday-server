import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import knex from 'knex';

const db =  knex({
    client: 'pg',
    connection: {
      connectionString : process.env.DATABASE_URL, //from heroku
      ssl: {
        rejectUnauthorized: false
      }
    }
  });



// on the terminal:
// PORT=3001 npm start

const myPORT = process.env.PORT;


const app = express();

app.use(bodyParser.json());
app.use(cors());

let currentUser;

app.get('/', (req, res) => {
    const {name, email, username, password} = req.body;
    db.select('*').from('users')
    .then(user => {
        if(user.length) {
              res.json(user) 
        } else {
         res.status(404).json('no such user')
        }
    // res.send(knex.database)
    // console.log(database);  
})
.catch(err => res.status(400).json('error getting info')) 
})

app.post('/login', (req, res) => {
    const {username, password} = req.body;
   db.select('password', 'username').from('login')
   .where({
    username: username,
    password:  password
  })
   .then(data => {
       db.select('*').from('users')
       .where('username', '=', username )
       .then(user => {
           res.json(currentUser = user[0])
       })
    .catch(err => res.status(400).json('error logging in'))   
})
.catch(err => res.status(400).json('wrong credentials'))   
});




app.post('/register', (req, res) => {
   const {name, email, username, password} = req.body;
   db.transaction(trx => {
    trx.insert({
      username: username,
      password: password
    })
    .into('login')
    .returning('username')
    .then(loginUsername => {
      return trx('users')
        .returning('*')
        .insert({
          username: loginUsername[0],
          name: name,
          email: email
              })
        .then(user => {
          res.json(user[0]);
        })
    })
    .then(trx.commit)
    //.catch(trx.rollback)
  })
  .catch(err => res.status(400).json('unable to register'))
})


app.put('/play', (req, res) => {
    const {username, lots} = req.body;
        db('users')
        .where({ username: currentUser })
        .select('lots').from('users')
        .update({lots})
        .returning('lots')
        .then(lots => {
            res.json(lots[0]);
        })   .catch(err => res.status(400).json('unable to get lots'))     
})



app.get('/profile/:id', (req, res) => {
    const {id} = req.params;
   db.select('*').from('users').where({ id })
   .then(user => {
       if(user.length) {
             res.json(user[0]) 
       } else {
        res.status(404).json('no such user')
       }
        })    
    .catch(err => res.status(400).json('error getting user'))
    })



app.listen(myPORT || 3000, ()=> {
    console.log(`app is running on port ${myPORT}`);
  });


//  / ---> res = this is wotking

//  /login---> POST  = success/failk
// /register ---> POST = user
// /profile/:userId ---> GET = user
// /play ---> PUT ----> user
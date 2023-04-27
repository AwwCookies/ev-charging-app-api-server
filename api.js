const { Pool, Client } = require('pg')

require('dotenv').config()

const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
})

client.connect()

// express server

const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // set port number
const jwtSecret = 'secret'; // change this to your own secret key

const cors = require('cors');

app.use(cors()); // use cors middleware
app.use(express.json()); // use json middleware

// Middleware to authenticate requests
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(authHeader)
  if (!authHeader) {
    return res.status(401).send('Authorization header missing');
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send('Invalid token');
    }

    req.user = decoded;
    next();
  });
}

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Sample user data (replace with your own database logic)
const users = [
  { id: 1, username: 'emma', password: '$2a$08$kn3.KGtCIkm5vr2Rgz4r/ONDVCAreB5xwuHyqGAjONZ2Kw0wpfvRq' }
];

// Authenticate a user and generate a JWT
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).send('Invalid credentials');
  }

  bcrypt.compare(password, user.password, (err, isMatch) => {
    if (err || !isMatch) {
      return res.status(401).send('Invalid credentials');
    }

    const payload = { id: user.id, username: user.username };
    const token = jwt.sign(payload, jwtSecret);
    res.json({ token });
  });
});


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/addCharge', auth, (req, res) => {
  if (!req.body.kwh) {
    return res.status(400).send(`Missing parameters: kwh\nGot: ${JSON.stringify(req.body)}`);
  }
  const q = 'INSERT INTO charges (kwh, date, username) VALUES ($1, $2, $3)';
  const values = [req.body.kwh, Date.now(), req.user.username];

  client.query(q, values, (err, result) => {
    if (err) {
      console.log(err.stack)
      res.status(500).send(`Error adding charge: ${err.stack}`);
    } else {
      res.status(200).send(`Charge added successfully: ${JSON.stringify(result)}`);
    }
  });
});

app.get('/getCharges', auth, (req, res) => {
  const q = 'SELECT * FROM charges WHERE username = $1';
  const values = [req.user.username];

  client.query(q, values, (err, result) => {
    if (err) {
      console.log(err.stack)
      res.status(500).send(`Error getting charges: ${err.stack}`);
    } else {
      res.status(200).json(result.rows)
    }
  });
});

app.delete('/removeCharge/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(400).send(`Invalid id: ${id}`);
  }
  const q = 'DELETE FROM charges WHERE id = $1 AND username = $2';
  const values = [id, req.user.username];
  client.query(q, values, (err, result) => {
    if (err) {
      console.log(err.stack);
      res.status(500).send(`Error deleting charge: ${err.stack}`);
    } else {
      res.status(200).send(`Charge deleted successfully: ${JSON.stringify(result)}`);
    }
  });
});



app.delete('clearCharges', auth, (req, res) => {
  const q = 'DELETE FROM charges WHERE username = $1';
  const values = [req.user.username];

  client.query(q, values, (err, result) => {
    if (err) {
      console.log(err.stack)
      res.status(500).send(`Error clearing charges: ${err.stack}`);
    } else {
      res.status(200).send(`Charges cleared successfully: ${JSON.stringify(result)}`);
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

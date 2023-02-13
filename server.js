//importing
import express from "express";
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from "pusher";
import cors from 'cors';

//app config
const app = express();
const port = process.env.PORT || 9000;
const pusher = new Pusher({
  appId: "1552814",
  key: "92497045b7862b1ae285",
  secret: "11e31e2c2df852f4c260",
  cluster: "ap2",
  useTLS: true
});

//middleware
app.use(express.json());
app.use(cors());

//db config
const connection_url = "mongodb+srv://admin:UJkdkCAhi878T6vY@cluster0.ihrxmrf.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//????
const db = mongoose.connection;
db.once('open', () => {
  console.log('DB connected');

  const messageCollection = db.collection('messagecontents');
  const changeStream = messageCollection.watch();

  changeStream.on('change', change => {

    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      console.log(messageDetails);

      pusher.trigger('messages', 'inserted', {
        _id: messageDetails._id,
        name: messageDetails.name,
        message: messageDetails.message,
        timeStamp: messageDetails.timeStamp,
        received: messageDetails.received,
      })
    }
    else {
      console.log('error triggering pusher');
    }
  })
});


//api routes
app.get('/', (req, res) => res.status(200).send('Hello World!'));

app.get('/messages/sync', (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.status(200).send(data);
    }
  })
})

app.post('/messages/new', (req, res) => {
  const messageData = req.body;

  Messages.create(messageData, (err, data) => {
    if (err) {
      res.status(500).send(err);
    }
    else {
      res.status(201).send(data);
    }
  });
});

//listening
app.listen(port, () => console.log(`listening on localhost:${port}`));
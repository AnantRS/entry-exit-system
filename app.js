const mongoose = require('mongoose');
const express = require('express');
const app = express();
const { People, Entry, Exit, History } = require('./models'); // Import models

app.use(express.json());

mongoose
  .connect(
    'mongodb+srv://anantrajshekhar:ZDgjFpMx1Q1Iq4Kl@cluster0.zpwoknx.mongodb.net/EntrySystem?retryWrites=true&w=majority&appName=Cluster0',
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log('DB connection successful!');
  })
  .catch((err) => {
    console.error('DB connection error:', err);
  });

app.get('/api/v1/history', async (req, res) => {
  const { id, start, end } = req.query;

  try {
    let historyList = await History.find();

    if (id) {
      historyList = historyList.filter((record) => record.id === parseInt(id));
    }

    if (start || end) {
      const startDate = start ? new Date(start) : new Date(-8640000000000000);
      const endDate = end ? new Date(end) : new Date(8640000000000000);

      const entries = await Entry.find({
        date: { $gte: startDate, $lte: endDate },
        ...(id && { id: parseInt(id) }),
      });

      const exits = await Exit.find({
        date: { $gte: startDate, $lte: endDate },
        ...(id && { id: parseInt(id) }),
      });

      const entryCounts = entries.reduce((acc, e) => {
        acc[e.id] = (acc[e.id] || 0) + 1;
        return acc;
      }, {});

      const exitCounts = exits.reduce((acc, e) => {
        acc[e.id] = (acc[e.id] || 0) + 1;
        return acc;
      }, {});

      historyList = Object.keys(entryCounts).map((id) => ({
        id,
        numberOfEntry: entryCounts[id],
        numberOfExit: exitCounts[id] || 0,
      }));
    }

    res.status(200).json({
      status: 'success',
      data: historyList,
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: 'Server error',
      error: err.message,
    });
  }
});

app.get('/api/v1/people', async (req, res) => {
  try {
    const people = await People.find();
    res.status(200).json({
      status: 'success',
      total_people: people.length,
      data: {
        people,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: 'Server error',
      error: err.message,
    });
  }
});

app.post('/api/v1/entry', async (req, res) => {
  try {
    const { id, name } = req.body;
    const personExists = await People.exists({ id });

    if (personExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'Person with this ID already exists in the building',
      });
    }

    const newPerson = await People.create({ id, name });
    const newEntry = await Entry.create({
      id,
      date: new Date().toISOString(),
      entrygate: req.body.entrygate,
    });

    let history = await History.findOne({ id });
    if (!history) {
      history = new History({ id, numberOfEntry: 0, numberOfExit: 0 });
    }
    history.numberOfEntry++;
    await history.save();

    res.status(201).json({
      status: 'success',
      data: {
        people: newPerson,
        entry: newEntry,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: 'Server error',
      error: err.message,
    });
  }
});

app.post('/api/v1/exit', async (req, res) => {
  const { id, exitgate } = req.body;

  try {
    const person = await People.findOneAndDelete({ id });

    if (!person) {
      return res.status(404).json({
        status: 'fail',
        message: 'Person not found',
      });
    }

    const newExit = await Exit.create({
      id,
      date: new Date().toISOString(),
      exitgate,
    });

    let history = await History.findOne({ id });
    if (!history) {
      history = new History({ id, numberOfEntry: 0, numberOfExit: 0 });
    }
    history.numberOfExit++;
    await history.save();

    res.status(201).json({
      status: 'success',
      data: {
        exit: newExit,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: 'Server error',
      error: err.message,
    });
  }
});

const port = 4000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

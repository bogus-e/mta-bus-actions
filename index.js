const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const secretsPath = path.join(__dirname, '.secrets.json');
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
const MTA_API_KEY = secrets.MTA_API_KEY;

app.get('/', (req, res) => {
  res.send('Welcome to the MTA Bus Time Service!');
});

app.get('/bus-time/:busLine/:stopId', async (req, res) => {
  const busLine = req.params.busLine.toUpperCase();
  const stopId = req.params.stopId;

  try {
    const response = await axios.get(
      'http://bustime.mta.info/api/siri/stop-monitoring.json',
      {
        params: {
          key: MTA_API_KEY,
          LineRef: `MTA NYCT_${busLine}`,
          MonitoringRef: stopId,
        },
      }
    );

    const arrivals = response.data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit;
    // res.send(arrivals)
    if (arrivals && arrivals.length > 0) {
      const nextBus = arrivals[0].MonitoredVehicleJourney.MonitoredCall.AimedDepartureTime;
      const easternTime = new Date(nextBus).toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hour12: true });
      res.send(`The next ${busLine} bus at stop ${stopId} is expected to depart at ${easternTime}.`);
    } else {
      res.send(`I'm sorry, but I couldn't find any upcoming ${busLine} buses at stop ${stopId}.`);
    }
  } catch (error) {
    console.error('Error fetching bus times:', error);
    res.status(500).send('There was an error retrieving the bus times. Please try again later.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

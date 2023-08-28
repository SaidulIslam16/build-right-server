const express = require('express');
const cors = require('cors');

const port = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Build-Right Server is Running');
});

app.listen(port, () => {
    console.log('Server running at port', port);
});
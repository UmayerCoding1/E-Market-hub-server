const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express());

app.get('/', (req,res) => {
    res.send('EMarket Hub server is ready');
});

app.get('/user', async (req,res) => {
    const user = [
        {name: 'Umayer Hossain ', age: 13 },
        {name: 'Rakib', age: 21}
    ]

    res.send(user)
})

app.listen(port, () => {
    console.log(`EMarket server running PORT:${port}`);
})
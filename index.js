const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Token is loaded from Railway environment variable for security
const SCALESMART_TOKEN = process.env.SCALESMART_TOKEN;
const PLUGIN_ENDPOINT = 'https://plasticworld.ca/wp-json/scalesmart/v1/order-lookup';

app.get('/ip', async (req, res) => {
  const response = await axios.get('https://api.ipify.org?format=json');
  res.json(response.data);
});

app.post('/order', async (req, res) => {
  let { order_id, search, caller_phone, caller_name } = req.body;

  order_id = order_id && order_id !== 'undefined' && String(order_id).trim() !== '' ? String(order_id).trim() : '';
  search = search && search !== 'undefined' && String(search).trim() !== '' ? String(search).trim() : '';
  caller_phone = caller_phone && caller_phone !== 'undefined' && String(caller_phone).trim() !== '' ? String(caller_phone).trim() : '';
  caller_name = caller_name && caller_name !== 'undefined' && String(caller_name).trim() !== '' ? String(caller_name).trim() : '';

  try {
    const response = await axios.post(
      PLUGIN_ENDPOINT,
      { order_id, search, caller_phone, caller_name },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Scalesmart-Token': SCALESMART_TOKEN
        },
        timeout: 15000
      }
    );
    res.json(response.data);
  } catch (err) {
    console.log('Order lookup error:', err.message);
    res.status(500).json({
      error: err.message,
      found: false,
      message: 'Unable to look up order at this time.'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

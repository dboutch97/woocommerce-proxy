const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const CONSUMER_KEY = 'ck_8fa83ba03ce5e7d45c22900c1c0150d12e342ffa';
const CONSUMER_SECRET = 'cs_71efe6814a1c95f41804f27b75687c8682e5d256';
const WC_BASE = 'https://plasticworld.ca/wp-json/wc/v3';

app.get('/order', async (req, res) => {
  const { order_id, search } = req.query;
  try {
    let url;
    if (order_id) {
      url = `${WC_BASE}/orders/${order_id}`;
    } else {
      url = `${WC_BASE}/orders?search=${encodeURIComponent(search)}`;
    }
    const response = await axios.get(url, {
      auth: { username: CONSUMER_KEY, password: CONSUMER_SECRET }
    });
    const order = Array.isArray(response.data) ? response.data[0] : response.data;
    if (!order || !order.id) {
      return res.json({ found: false, message: 'No order found.' });
    }
    res.json({
      found: true,
      order_id: order.id,
      status: order.status,
      customer_name: `${order.billing.first_name} ${order.billing.last_name}`,
      notes: order.customer_note || 'No notes on this order.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

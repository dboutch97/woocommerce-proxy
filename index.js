const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CONSUMER_KEY = process.env.WC_CONSUMER_KEY || 'ck_8fa83ba03ce5e7d45c22900c1c0150d12e342ffa';
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || 'cs_71efe6814a1c95f41804f27b75687c8682e5d256';
const WC_BASE = 'https://plasticworld.ca/wp-json/wc/v3';

const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive'
};

app.get('/ip', async (req, res) => {
  const response = await axios.get('https://api.ipify.org?format=json');
  res.json(response.data);
});

app.post('/order', async (req, res) => {
  let { order_id, search, caller_phone, caller_name } = req.body;

  order_id = order_id && order_id !== 'undefined' && String(order_id).trim() !== '' ? String(order_id).trim() : null;
  search = search && search !== 'undefined' && String(search).trim() !== '' ? String(search).trim() : null;
  caller_phone = caller_phone && caller_phone !== 'undefined' && String(caller_phone).trim() !== '' ? String(caller_phone).trim() : null;
  caller_name = caller_name && caller_name !== 'undefined' && String(caller_name).trim() !== '' ? String(caller_name).trim() : null;

  const auth = `consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;

  try {
    let url;
    if (order_id) {
      url = `${WC_BASE}/orders/${order_id}?${auth}`;
    } else if (caller_phone) {
      url = `${WC_BASE}/orders?search=${encodeURIComponent(caller_phone)}&${auth}`;
    } else if (search) {
      url = `${WC_BASE}/orders?search=${encodeURIComponent(search)}&${auth}`;
    } else if (caller_name) {
      url = `${WC_BASE}/orders?search=${encodeURIComponent(caller_name)}&${auth}`;
    } else {
      return res.json({ found: false, message: 'No order information provided.' });
    }

    const response = await axios.get(url, { headers: browserHeaders, timeout: 15000 });
    const order = Array.isArray(response.data) ? response.data[0] : response.data;

    if (!order || !order.id) {
      return res.json({ found: false, message: 'No order found.' });
    }

    let internalNotes = [];
    try {
      const notesUrl = `${WC_BASE}/orders/${order.id}/notes?${auth}`;
      const notesResponse = await axios.get(notesUrl, { headers: browserHeaders, timeout: 10000 });
      internalNotes = notesResponse.data
        .filter(n => !n.customer_note)
        .map(n => n.note)
        .slice(0, 5);
    } catch (notesErr) {
      console.log('Could not fetch notes:', notesErr.message);
    }

    const items = order.line_items.map(item => `${item.name} x${item.quantity}`).join(', ');
    const paymentMethod = order.payment_method_title || 'Unknown';

    res.json({
      found: true,
      order_id: order.id,
      status: order.status,
      customer_name: `${order.billing.first_name} ${order.billing.last_name}`,
      customer_note: order.customer_note || '',
      internal_notes: internalNotes.join(' | ') || 'No internal notes.',
      payment_method: paymentMethod,
      items: items || 'No items found.',
      total: `$${order.total} ${order.currency}`,
      date_created: order.date_created
    });
  } catch (err) {
    console.log('Order lookup error:', err.message);
    res.status(500).json({ error: err.message, found: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

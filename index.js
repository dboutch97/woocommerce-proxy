app.get('/order', async (req, res) => {
  let { order_id, search, caller_phone, caller_name } = req.query;
  
  order_id = order_id && order_id !== 'undefined' && order_id.trim() !== '' ? order_id.trim() : null;
  search = search && search !== 'undefined' && search.trim() !== '' ? search.trim() : null;
  caller_phone = caller_phone && caller_phone !== 'undefined' && caller_phone.trim() !== '' ? caller_phone.trim() : null;
  caller_name = caller_name && caller_name !== 'undefined' && caller_name.trim() !== '' ? caller_name.trim() : null;

  try {
    let url;
    if (order_id) {
      url = `${WC_BASE}/orders/${order_id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    } else if (caller_phone) {
      url = `${WC_BASE}/orders?search=${encodeURIComponent(caller_phone)}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    } else if (search) {
      url = `${WC_BASE}/orders?search=${encodeURIComponent(search)}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    } else if (caller_name) {
      url = `${WC_BASE}/orders?search=${encodeURIComponent(caller_name)}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    } else {
      return res.json({ found: false, message: 'No order information provided.' });
    }

    const response = await axios.get(url);
    const order = Array.isArray(response.data) ? response.data[0] : response.data;

    if (!order || !order.id) {
      return res.json({ found: false, message: 'No order found.' });
    }

    const items = order.line_items.map(item => `${item.name} x${item.quantity}`).join(', ');

    res.json({
      found: true,
      order_id: order.id,
      status: order.status,
      customer_name: `${order.billing.first_name} ${order.billing.last_name}`,
      notes: order.customer_note || 'No notes on this order.',
      order_notes: order.meta_data ? 'See order notes in WooCommerce' : 'No internal notes.',
      items: items || 'No items found.',
      total: `$${order.total} ${order.currency}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

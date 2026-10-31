const { HttpError } = require("./errors");
const { transacao } = require("./db");

// Quem pode ir para onde. Entregue e cancelado são finais.
const FLUXO = { pending: ["paid", "cancelled"], paid: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [] };
const CARIMBO = { paid: "paid_at", shipped: "shipped_at", delivered: "delivered_at" };

/** Muda o status respeitando o fluxo. Cancelar devolve as peças ao estoque, na mesma transação. */
function mudarStatus(db, orderId, novo) {
  return transacao(db, () => {
    const o = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    if (!o) throw new HttpError(404, "Pedido não encontrado.");
    if (!FLUXO[o.status]?.includes(novo)) throw new HttpError(409, `Este pedido está "${o.status}" e não pode passar para "${novo}".`);
    if (novo === "cancelled") {
      const devolve = db.prepare("INSERT INTO stock (product_id, size, quantity) VALUES (?, ?, ?) ON CONFLICT (product_id, size) DO UPDATE SET quantity = quantity + excluded.quantity");
      for (const i of db.prepare("SELECT product_id, size, quantity FROM order_items WHERE order_id = ?").all(orderId)) devolve.run(i.product_id, i.size, i.quantity);
    }
    const carimbo = CARIMBO[novo];
    db.prepare(`UPDATE orders SET status = ?${carimbo ? `, ${carimbo} = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')` : ""} WHERE id = ?`).run(novo, orderId);
    return db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  });
}

function pedidoParaApi(db, o) {
  return {
    id: o.id, status: o.status, createdAt: o.created_at, paidAt: o.paid_at, shippedAt: o.shipped_at, deliveredAt: o.delivered_at,
    subtotalCents: o.subtotal_cents, discountCents: o.discount_cents, pixDiscountCents: o.pix_discount_cents,
    shippingCents: o.shipping_cents, shippingMethod: o.shipping_method, totalCents: o.total_cents,
    coupon: o.coupon, payment: o.payment_method,
    address: { name: o.ship_name, cep: o.ship_cep, street: o.ship_street, number: o.ship_number, complement: o.ship_complement, district: o.ship_district, city: o.ship_city, state: o.ship_state },
    items: db.prepare("SELECT product_id AS productId, name, color, design, cut, size, unit_price_cents AS unitPriceCents, quantity FROM order_items WHERE order_id = ? ORDER BY id").all(o.id),
  };
}

module.exports = { FLUXO, mudarStatus, pedidoParaApi };

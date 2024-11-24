import { useState, useEffect } from 'react';
import axios from 'axios';

function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('https://ecommerce-camisas.onrender.com/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => setOrders(response.data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-semibold text-center mb-6">Your Orders</h2>
      {orders.length === 0 ? (
        <p className="text-center text-gray-600">No orders found.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold">Order #{order.id}</h3>
              <p className="text-gray-600">Status: <span className="font-medium">{order.status}</span></p>
              <p className="text-lg font-semibold text-gray-800 mt-2">
                Total Price: <span className="text-blue-600">${order.totalPrice.toFixed(2)}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;

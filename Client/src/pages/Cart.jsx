import { useState, useEffect } from 'react';
import axios from 'axios';
import CartItem from '../components/CartItem';

function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:3000/api/cart', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => setCart(response.data.CartItems || []))
      .catch((error) => console.error(error));
  }, []);

  const removeItem = (productId) => {
    const token = localStorage.getItem('token');
    axios.post(
      'http://localhost:3000/api/cart/remove',
      { productId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(() => {
        alert('Item removed!');
        setCart((prev) => prev.filter((item) => item.Product.id !== productId));
      })
      .catch((error) => console.error(error));
  };

  const handleCheckout = () => {
    const token = localStorage.getItem('token');
    axios.post(
      'http://localhost:3000/api/orders',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(() => {
        alert('Order placed successfully!');
        setCart([]);
      })
      .catch((error) => console.error(error));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-semibold text-center mb-8">Your Cart</h2>
      
      {/* Cart List */}
      <div className="space-y-6">
        {cart.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onRemove={removeItem}
          />
        ))}
      </div>

      {/* Checkout Button */}
      {cart.length > 0 && (
        <div className="flex justify-center mt-8">
          <button 
            onClick={handleCheckout} 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;

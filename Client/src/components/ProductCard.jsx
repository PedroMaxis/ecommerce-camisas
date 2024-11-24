import React from 'react';

function ProductCard({ product, onAddToCart }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 transition-transform transform hover:scale-105">
      <img src={product.imageUrl} alt={product.name} className="w-full h-64 object-cover rounded-lg mb-4" />
      <h3 className="text-xl font-medium mb-2">{product.name}</h3>
      <p className="text-gray-600 mb-4">{product.description}</p>
      <button 
        onClick={() => onAddToCart(product.id)} 
        className="bg-green-500 text-white px-4 py-2 rounded-lg w-full transition-colors hover:bg-green-600">
        Add to Cart
      </button>
    </div>
  );
}

export default ProductCard;

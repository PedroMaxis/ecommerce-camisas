function CartItem({ item, onRemove }) {
  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800">{item.Product.name}</h3>
        <p className="text-gray-600">Quantity: {item.quantity}</p>
        <p className="text-gray-800 font-semibold mt-2">
          Price: <span className="text-blue-600">${item.Product.price.toFixed(2)}</span>
        </p>
      </div>
      <button
        onClick={() => onRemove(item.Product.id)}
        className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
      >
        Remove
      </button>
    </div>
  );
}

export default CartItem;

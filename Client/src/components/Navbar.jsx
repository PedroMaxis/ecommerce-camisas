import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-blue-600 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-2xl font-semibold">E-commerce</h1>
        <div className="space-x-6">
          <Link to="/" className="text-white hover:text-gray-300 transition-colors">Home</Link>
          <Link to="/cart" className="text-white hover:text-gray-300 transition-colors">Cart</Link>
          <Link to="/orders" className="text-white hover:text-gray-300 transition-colors">Orders</Link>
          <Link to="/login" className="text-white hover:text-gray-300 transition-colors">Login</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

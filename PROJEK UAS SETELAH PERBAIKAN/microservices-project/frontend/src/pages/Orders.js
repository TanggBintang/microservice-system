import React, { useState, useEffect } from 'react';
import axios from 'axios';


const Orders = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  // Form state for new order
  const [newOrder, setNewOrder] = useState({
    customer_name: user?.username || '',
    customer_email: user?.email || '',
    customer_phone: '',
    shipping_address: '',
    items: []
  });

  // Cart state for order items
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchOrders();
      await fetchProducts();
    };
    fetchData();
  }, []); // Hapus dependency array atau tambahkan fetchOrders dan fetchProducts

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:8003');
      setOrders(response.data);
    } catch (error) {
      showAlert('Failed to fetch orders', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:8002');
      setProducts(response.data);
    } catch (error) {
      showAlert('Failed to fetch products', 'danger');
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      showAlert('Please add at least one item to the order', 'warning');
      return;
    }

    try {
      const orderData = {
        ...newOrder,
        user_id: user.id,
        items: cart
      };

      await axios.post('http://localhost:8003', orderData);
      showAlert('Order created successfully!', 'success');
      setShowModal(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      showAlert('Failed to create order', 'danger');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`http://localhost:8003/${orderId}/status`, { status });
      showAlert('Order status updated successfully!', 'success');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedOrder = { ...selectedOrder, status };
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      showAlert('Failed to update order status', 'danger');
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const response = await axios.get(`http://localhost:8003/${orderId}`);
      setSelectedOrder(response.data);
      setShowDetailModal(true);
    } catch (error) {
      showAlert('Failed to fetch order details', 'danger');
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const resetForm = () => {
    setNewOrder({
      customer_name: user?.username || '',
      customer_email: user?.email || '',
      customer_phone: '',
      shipping_address: '',
      items: []
    });
    setCart([]);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'warning',
      confirmed: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'danger'
    };
    return statusMap[status] || 'secondary';
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {alert.show && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert({ show: false, message: '', type: '' })}></button>
        </div>
      )}

      <div className="row mb-4">
        <div className="col">
          <h2 className="text-primary fw-bold mb-0">
            <i className="fas fa-shopping-bag me-2"></i>
            Order Management
          </h2>
          <p className="text-muted">Manage your orders and track shipments</p>
        </div>
        <div className="col-auto">
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus me-2"></i>
            Create New Order
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">
            <i className="fas fa-list me-2"></i>
            Orders List
          </h5>
        </div>
        <div className="card-body">
          {orders.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-shopping-bag fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No orders found</h5>
              <p className="text-muted">Create your first order to get started</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <span className="fw-bold">#{order.id}</span>
                      </td>
                      <td>
                        <div>
                          <div className="fw-bold">{order.customer_name}</div>
                          <small className="text-muted">{order.customer_email}</small>
                        </div>
                      </td>
                      <td>
                        <span className="fw-bold text-success">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${getStatusBadge(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {order.items || 'Multiple items'}
                        </small>
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <div className="dropdown">
                            <button 
                              className="btn btn-outline-success dropdown-toggle"
                              data-bs-toggle="dropdown"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <ul className="dropdown-menu">
                              <li><button className="dropdown-item" onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}>Confirm</button></li>
                              <li><button className="dropdown-item" onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}>Ship</button></li>
                              <li><button className="dropdown-item" onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}>Deliver</button></li>
                              <li><hr className="dropdown-divider" /></li>
                              <li><button className="dropdown-item text-danger" onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}>Cancel</button></li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      <div className={`modal fade ${showModal ? 'show' : ''}`} style={{ display: showModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-plus me-2"></i>
                Create New Order
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">Customer Information</h6>
                    <div className="mb-3">
                      <label className="form-label">Customer Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newOrder.customer_name}
                        onChange={(e) => setNewOrder({...newOrder, customer_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={newOrder.customer_email}
                        onChange={(e) => setNewOrder({...newOrder, customer_email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newOrder.customer_phone}
                        onChange={(e) => setNewOrder({...newOrder, customer_phone: e.target.value})}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Shipping Address</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={newOrder.shipping_address}
                        onChange={(e) => setNewOrder({...newOrder, shipping_address: e.target.value})}
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">Add Products</h6>
                    <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {products.map(product => (
                        <div key={product.id} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                          <div className="flex-grow-1">
                            <div className="fw-bold">{product.name}</div>
                            <small className="text-success">{formatCurrency(product.price)}</small>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => addToCart(product)}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <h6 className="fw-bold mb-3">Order Items ({cart.length})</h6>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {cart.length === 0 ? (
                        <p className="text-muted text-center">No items added</p>
                      ) : (
                        cart.map(item => (
                          <div key={item.product_id} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                            <div className="flex-grow-1">
                              <div className="fw-bold">{item.product_name}</div>
                              <small className="text-muted">{formatCurrency(item.price)} each</small>
                            </div>
                            <div className="d-flex align-items-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                              >
                                -
                              </button>
                              <span className="mx-2">{item.quantity}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger ms-2"
                                onClick={() => removeFromCart(item.product_id)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {cart.length > 0 && (
                      <div className="border-top pt-3 mt-3">
                        <div className="d-flex justify-content-between fw-bold">
                          <span>Total:</span>
                          <span className="text-success">{formatCurrency(calculateTotal())}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      <div className={`modal fade ${showDetailModal ? 'show' : ''}`} style={{ display: showDetailModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-receipt me-2"></i>
                Order Details #{selectedOrder?.id}
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
            </div>
            <div className="modal-body">
              {selectedOrder && (
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">Customer Information</h6>
                    <table className="table table-borderless table-sm">
                      <tbody>
                        <tr>
                          <td className="fw-bold">Name:</td>
                          <td>{selectedOrder.customer_name}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Email:</td>
                          <td>{selectedOrder.customer_email}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Phone:</td>
                          <td>{selectedOrder.customer_phone || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Address:</td>
                          <td>{selectedOrder.shipping_address}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">Order Information</h6>
                    <table className="table table-borderless table-sm">
                      <tbody>
                        <tr>
                          <td className="fw-bold">Status:</td>
                          <td>
                            <span className={`badge bg-${getStatusBadge(selectedOrder.status)}`}>
                              {selectedOrder.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Total:</td>
                          <td className="text-success fw-bold">{formatCurrency(selectedOrder.total_amount)}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Date:</td>
                          <td>{new Date(selectedOrder.created_at).toLocaleString('id-ID')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {selectedOrder?.items && selectedOrder.items.length > 0 && (
                <div className="mt-4">
                  <h6 className="fw-bold mb-3">Order Items</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map(item => (
                          <tr key={item.id}>
                            <td>{item.product_name}</td>
                            <td>{formatCurrency(item.price)}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Backdrop */}
      {(showModal || showDetailModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
};

export default Orders;
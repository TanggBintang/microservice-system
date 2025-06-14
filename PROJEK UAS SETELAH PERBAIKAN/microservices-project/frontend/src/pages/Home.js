import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/products/');
      setProducts(response.data.slice(0, 4)); // Show only first 4 products
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Welcome to MicroStore
              </h1>
              <p className="lead mb-4">
                Discover amazing products with our modern microservice-based e-commerce platform. 
                Built with cutting-edge technology for the best shopping experience.
              </p>
              <div className="d-flex gap-3">
                <a href="#products" className="btn btn-light btn-lg">
                  <i className="fas fa-shopping-bag me-2"></i>
                  Shop Now
                </a>
                <a href="#features" className="btn btn-outline-light btn-lg">
                  Learn More
                </a>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <i className="fas fa-shopping-cart" style={{ fontSize: '10rem', opacity: 0.3 }}></i>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <h2 className="display-5 fw-bold text-primary mb-3">Why Choose MicroStore?</h2>
              <p className="lead text-muted">Built with modern microservice architecture</p>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card feature-card h-100 text-center p-4">
                <div className="card-body">
                  <div className="mb-3">
                    <i className="fas fa-rocket text-primary" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5 className="card-title">Fast & Reliable</h5>
                  <p className="card-text text-muted">
                    Lightning-fast performance with 99.9% uptime guarantee. 
                    Built on scalable microservice architecture.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card feature-card h-100 text-center p-4">
                <div className="card-body">
                  <div className="mb-3">
                    <i className="fas fa-shield-alt text-success" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5 className="card-title">Secure Shopping</h5>
                  <p className="card-text text-muted">
                    Your data is protected with enterprise-grade security. 
                    Safe and secure payment processing.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card feature-card h-100 text-center p-4">
                <div className="card-body">
                  <div className="mb-3">
                    <i className="fas fa-headset text-info" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5 className="card-title">24/7 Support</h5>
                  <p className="card-text text-muted">
                    Round-the-clock customer support to help you with any questions 
                    or concerns you may have.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="py-5 bg-light">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <h2 className="display-5 fw-bold text-primary mb-3">Featured Products</h2>
              <p className="lead text-muted">Check out our most popular items</p>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading featured products...</p>
            </div>
          ) : (
            <div className="row g-4">
              {products.map((product) => (
                <div key={product.id} className="col-lg-3 col-md-6">
                  <div className="card product-card h-100">
                    <img 
                      src={product.image_url} 
                      className="card-img-top product-image" 
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
                      }}
                    />
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-truncate">{product.name}</h5>
                      <p className="card-text text-muted small flex-grow-1">
                        {product.description}
                      </p>
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="h5 text-primary mb-0">
                            {formatPrice(product.price)}
                          </span>
                          <span className="badge bg-success">
                            Stock: {product.stock}
                          </span>
                        </div>
                        <button className="btn btn-primary w-100">
                          <i className="fas fa-cart-plus me-2"></i>
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-5">
            <a href="/products" className="btn btn-outline-primary btn-lg">
              <i className="fas fa-eye me-2"></i>
              View All Products
            </a>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-5">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-3 col-6 mb-4">
              <div className="p-3">
                <i className="fas fa-users text-primary mb-3" style={{ fontSize: '2.5rem' }}></i>
                <h3 className="fw-bold">1000+</h3>
                <p className="text-muted">Happy Customers</p>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-4">
              <div className="p-3">
                <i className="fas fa-box text-success mb-3" style={{ fontSize: '2.5rem' }}></i>
                <h3 className="fw-bold">500+</h3>
                <p className="text-muted">Products</p>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-4">
              <div className="p-3">
                <i className="fas fa-shipping-fast text-info mb-3" style={{ fontSize: '2.5rem' }}></i>
                <h3 className="fw-bold">2000+</h3>
                <p className="text-muted">Orders Delivered</p>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-4">
              <div className="p-3">
                <i className="fas fa-star text-warning mb-3" style={{ fontSize: '2.5rem' }}></i>
                <h3 className="fw-bold">4.8</h3>
                <p className="text-muted">Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-primary text-white">
        <div className="container text-center">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <h2 className="display-5 fw-bold mb-4">Ready to Start Shopping?</h2>
              <p className="lead mb-4">
                Join thousands of satisfied customers and experience the future of online shopping.
              </p>
              <a href="/login" className="btn btn-light btn-lg me-3">
                <i className="fas fa-user-plus me-2"></i>
                Get Started
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
class Order {
  constructor(id, user_id, customer_name, customer_email, total_amount, status, shipping_address) {
    this.id = id;
    this.user_id = user_id;
    this.customer_name = customer_name;
    this.customer_email = customer_email;
    this.total_amount = total_amount;
    this.status = status;
    this.shipping_address = shipping_address;
  }
  
  static validate(data) {
    const errors = [];
    
    if (!data.customer_name || data.customer_name.length < 2) {
      errors.push('Customer name is required');
    }
    
    if (!data.customer_email || !data.customer_email.includes('@')) {
      errors.push('Valid email is required');
    }
    
    if (!data.shipping_address || data.shipping_address.length < 10) {
      errors.push('Shipping address is required');
    }
    
    if (!data.items || data.items.length === 0) {
      errors.push('At least one item is required');
    }
    
    return errors;
  }
}

module.exports = Order;
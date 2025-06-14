class Shipping {
  constructor(id, order_id, tracking_number, carrier, status, shipping_address) {
    this.id = id;
    this.order_id = order_id;
    this.tracking_number = tracking_number;
    this.carrier = carrier;
    this.status = status;
    this.shipping_address = shipping_address;
  }
  
  static validate(data) {
    const errors = [];
    
    if (!data.order_id) {
      errors.push('Order ID is required');
    }
    
    if (!data.carrier || data.carrier.length < 2) {
      errors.push('Carrier name is required');
    }
    
    if (!data.shipping_address || data.shipping_address.length < 10) {
      errors.push('Shipping address is required');
    }
    
    return errors;
  }
  
  static generateTrackingNumber() {
    return 'TRK' + Date.now() + Math.floor(Math.random() * 1000);
  }
}

module.exports = Shipping;
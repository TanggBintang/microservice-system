class Product {
  constructor(id, name, description, price, stock, category, image_url) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.stock = stock;
    this.category = category;
    this.image_url = image_url;
  }
  
  static validate(data) {
    const errors = [];
    
    if (!data.name || data.name.length < 3) {
      errors.push('Product name must be at least 3 characters');
    }
    
    if (!data.price || data.price <= 0) {
      errors.push('Product price must be greater than 0');
    }
    
    if (data.stock < 0) {
      errors.push('Product stock cannot be negative');
    }
    
    return errors;
  }
}

module.exports = Product;
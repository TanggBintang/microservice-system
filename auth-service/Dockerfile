FROM php:8.1-apache

# Update package list dan install dependencies
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Install required PHP extensions
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Enable Apache modules
RUN a2enmod rewrite headers

# Create necessary directories
RUN mkdir -p /var/www/html

# Copy source code
COPY . /var/www/html/

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Configure PHP for better error reporting
RUN echo "log_errors = On" >> /usr/local/etc/php/php.ini \
    && echo "error_log = /var/log/apache2/php_errors.log" >> /usr/local/etc/php/php.ini \
    && echo "display_errors = On" >> /usr/local/etc/php/php.ini

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
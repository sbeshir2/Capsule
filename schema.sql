-- Capsule: Digital Closet | MySQL schema
DROP DATABASE IF EXISTS capsule_db;
CREATE DATABASE capsule_db;
USE capsule_db;
-- Users (Accounts & Profiles, Weather-Aware Suggestions Table)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    -- bcrypt hash, never plain text 
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    profile_img_url VARCHAR(255),
    bio VARCHAR(255),
    style_pref ENUM(
        'casual',
        'business casual',
        'streetwear',
        'athleisure',
        'boho',
        'minimalist',
        'alt',
        'classic',
        'sporty'
    ) DEFAULT 'casual',
    city VARCHAR(80),
    -- for weather API lookups 
    zip_code VARCHAR(10),
    temp_unit ENUM('F', 'C') DEFAULT 'F',
    -- Celsius or Fahrenheit
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Related Tables (Relational design for the rest of the features)
CREATE TABLE clothing_items (
    -- Digital Closet + Analytics
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    category ENUM(
        'tops',
        'bottoms',
        'dress',
        'coats',
        'outerwear',
        'shoes',
        'accessories'
    ) NOT NULL,
    color VARCHAR(30),
    brand VARCHAR(50),
    season VARCHAR(10) DEFAULT 'all',
    min_temp INT,
    -- Minimum temperature for wearing this item
    max_temp INT,
    -- Maximum temperature for wearing this item
    image_url VARCHAR(255) NOT NULL,
    price DECIMAL(8, 2),
    times_worn INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE outfits (
    -- Outfit Builder + Saved Outfits 
    outfit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    outfit_name VARCHAR(100),
    occasion VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE outfit_items (
    -- Many-to-Many: outfits <-> items 
    outfit_id INT NOT NULL,
    item_id INT NOT NULL,
    PRIMARY KEY (outfit_id, item_id),
    FOREIGN KEY (outfit_id) REFERENCES outfits(outfit_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES clothing_items(item_id) ON DELETE CASCADE
);
CREATE TABLE outfit_calendar (
    -- Outfit Calendar & Planning 
    calendar_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    outfit_id INT NOT NULL,
    planned_date DATE NOT NULL,
    notes VARCHAR(255),
    UNIQUE (user_id, planned_date),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (outfit_id) REFERENCES outfits(outfit_id) ON DELETE CASCADE
);
CREATE TABLE wishlist (
    -- Wishlist & Shopping List 
    wish_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    store_url VARCHAR(255),
    price DECIMAL(8, 2),
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
-- Dummy Data for the user tables 
-- (hashes are sample bcrypt strings, not real passwords)
INSERT INTO users (
        username,
        email,
        password_hash,
        first_name,
        last_name,
        profile_img_url,
        bio,
        style_pref,
        city,
        zip_code,
        temp_unit
    )
VALUES (
        'sabrina_beshir',
        'sabrina@capsule.dev',
        'sabrinabeshir1234',
        'Sabrina',
        'Beshir',
        'https://example.com/profiles/sabrina.jpg',
        'Fashion enthusiast and digital closet lover.',
        'streetwear',
        'Los Angeles',
        '90001',
        'F'
    ),
    (
        'alex_jordan',
        'alex@capsule.dev',
        'alexjordan1234',
        'Alex',
        'Jordan',
        'https://example.com/profiles/alex.jpg',
        'Minimalist with a twist of bohemian style.',
        'minimalist',
        'New York',
        '10001',
        'F'
    ),
    (
        'jordan_smith',
        'jordan@capsule.dev',
        'jordansmith1234',
        'Jordan',
        'Smith',
        'https://example.com/profiles/jordan.jpg',
        'Adventure seeker and outdoor enthusiast.',
        'casual',
        'Denver',
        '80201',
        'F'
    ),
    (
        'lisa_kim',
        'lisa@capsule.dev',
        'lisakim1234',
        'Lisa',
        'Kim',
        'https://example.com/profiles/lisa.jpg',
        'Elegant and timeless style.',
        'classic',
        'Chicago',
        '60601',
        'F'
    ),
    (
        'michael_lee',
        'michael@capsule.dev',
        'michaellee1234',
        'Michael',
        'Lee',
        'https://example.com/profiles/michael.jpg',
        'Sporty and active lifestyle.',
        'sporty',
        'Austin',
        '78701',
        'F'
    );
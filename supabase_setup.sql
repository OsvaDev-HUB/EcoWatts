-- SQL Script to initialize EcoWatts Database in Supabase
-- Run this in the Supabase SQL Editor

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    tarifa_kwh FLOAT DEFAULT 236.0
);

-- Create Aparatos table
CREATE TABLE IF NOT EXISTS aparatos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    potencia FLOAT NOT NULL,
    horas FLOAT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ix_users_username ON users (username);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE INDEX IF NOT EXISTS ix_aparatos_user_id ON aparatos (user_id);

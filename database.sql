-- ============================================
-- APP PROTECTION DATABASE
-- PostgreSQL
-- ============================================

-- ============================================
-- ADMINS
-- ============================================

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- APPS
-- ============================================

CREATE TABLE IF NOT EXISTS apps (
    id SERIAL PRIMARY KEY,
    app_name VARCHAR(150) NOT NULL,
    package_name VARCHAR(200) UNIQUE NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    version VARCHAR(50) DEFAULT '1.0',
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- DEVICES
-- ============================================

CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,

    app_id INTEGER NOT NULL
        REFERENCES apps(id)
        ON DELETE CASCADE,

    android_id VARCHAR(255) NOT NULL,

    device_model VARCHAR(150),
    manufacturer VARCHAR(150),
    android_version VARCHAR(50),

    status VARCHAR(30) DEFAULT 'Pending',

    active_until TIMESTAMP NULL,

    last_seen TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(app_id, android_id)
);


-- ============================================
-- VERIFICATION CODES
-- ============================================

CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,

    app_id INTEGER NOT NULL
        REFERENCES apps(id)
        ON DELETE CASCADE,

    code VARCHAR(100) UNIQUE NOT NULL,

    expiry_hours INTEGER DEFAULT 24,

    expires_at TIMESTAMP NOT NULL,

    status VARCHAR(30) DEFAULT 'Active',

    device_id INTEGER NULL
        REFERENCES devices(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    used_at TIMESTAMP NULL
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_apps_api_key
ON apps(api_key);

CREATE INDEX IF NOT EXISTS idx_devices_android_id
ON devices(android_id);

CREATE INDEX IF NOT EXISTS idx_devices_app_id
ON devices(app_id);

CREATE INDEX IF NOT EXISTS idx_verification_codes_code
ON verification_codes(code);

CREATE INDEX IF NOT EXISTS idx_verification_codes_app_id
ON verification_codes(app_id);

CREATE INDEX IF NOT EXISTS idx_verification_codes_status
ON verification_codes(status);


-- ============================================
-- DONE
-- ============================================

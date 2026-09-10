const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const { ROLES } = require('../constants/roles');
const { resolveCoordinates } = require('../utils/geoUtils');
const { apiSuccess, apiError } = require('../utils/apiResponse');

/**
 * Generate JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
        },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
    );
};

/**
 * Register a new user with their role-specific profile
 */
const register = async (req, res, next) => {
    const client = await db.getClient();
    try {
        const {
            email,
            password,
            role,
            phone,
            // Common name field from frontend (organizationName or fullName)
            fullName,
            organizationName,
            // Donor specific
            bloodGroup,
            age,
            weightKg,
            lastDonationDate,
            // Hospital specific
            hospitalAddress,
            hospitalRegistrationNumber,
            emergencyContact,
            speciality,
            // Patient specific
            patientAddress,
            medicalCondition,
            attendingDoctor,
            // Blood Bank specific (and NGO backward compatibility)
            bloodBankName,
            licenseNumber,
            directorName,
            operatingHours,
            bloodBankAddress,
            ngoAddress,
            ngoRegistrationNumber,
            coordinatorName,
            areasOfOperation,
            // Geolocation
            location, // text name from frontend: "Pimpri, Pune"
            latitude,
            longitude,
        } = req.body;

        const effectiveRole = (role === 'ngo' || role === ROLES.NGO) ? ROLES.BLOOD_BANK : role;

        // Check if user already exists
        const existingCheck = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );
        if (existingCheck.rows.length > 0) {
            return apiError(res, 'An account with this email already exists.', 409);
        }

        // Hash password securely with bcrypt (10 rounds)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Resolve coordinates with fallback
        const coords = resolveCoordinates(latitude, longitude);
        const locationName = location || hospitalAddress || ngoAddress || patientAddress || 'Pune, Maharashtra';

        await client.query('BEGIN');

        // 1. Insert into users table
        const userInsert = await client.query(
            `INSERT INTO users (email, password_hash, role, phone)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, role, phone, is_active, created_at;`,
            [email.toLowerCase().trim(), passwordHash, effectiveRole, phone]
        );
        const newUser = userInsert.rows[0];

        let profileData = {};

        // 2. Insert into role-specific table with PostGIS geometry
        if (role === ROLES.DONOR) {
            const donorName = fullName || organizationName || 'Anonymous Donor';
            const donorInsert = await client.query(
                `INSERT INTO donors (
                    user_id, full_name, blood_group, age, weight_kg,
                    location_name, geom, last_donation_date
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6,
                    ST_SetSRID(ST_MakePoint($7, $8), 4326),
                    $9
                )
                RETURNING id, full_name, blood_group, age, weight_kg, location_name, availability_status, last_donation_date;`,
                [
                    newUser.id,
                    donorName,
                    bloodGroup || 'O+',
                    age ? parseInt(age, 10) : 25,
                    weightKg ? parseFloat(weightKg) : 65.0,
                    locationName,
                    coords.longitude,
                    coords.latitude,
                    lastDonationDate || null,
                ]
            );
            profileData = donorInsert.rows[0];
        } else if (role === ROLES.HOSPITAL) {
            const name = organizationName || fullName || 'City Hospital';
            const licenseNo = hospitalRegistrationNumber || `LIC-${Date.now()}`;
            const address = hospitalAddress || locationName;
            const hospitalInsert = await client.query(
                `INSERT INTO hospitals (
                    user_id, hospital_name, license_number, address, emergency_contact,
                    speciality, geom
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6,
                    ST_SetSRID(ST_MakePoint($7, $8), 4326)
                )
                RETURNING id, hospital_name, license_number, address, emergency_contact, speciality, verification_status;`,
                [
                    newUser.id,
                    name,
                    licenseNo,
                    address,
                    emergencyContact || phone,
                    speciality || 'General Medicine, Trauma',
                    coords.longitude,
                    coords.latitude,
                ]
            );
            profileData = hospitalInsert.rows[0];
        } else if (role === ROLES.PATIENT) {
            const name = fullName || 'Patient';
            const address = patientAddress || locationName;
            const patientInsert = await client.query(
                `INSERT INTO patients (
                    user_id, full_name, blood_group, medical_condition, attending_doctor,
                    address, emergency_contact, geom
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7,
                    ST_SetSRID(ST_MakePoint($8, $9), 4326)
                )
                RETURNING id, full_name, blood_group, medical_condition, attending_doctor, address, emergency_contact;`,
                [
                    newUser.id,
                    name,
                    bloodGroup || 'O+',
                    medicalCondition || 'Under evaluation',
                    attendingDoctor || 'Primary Care Physician',
                    address,
                    emergencyContact || phone,
                    coords.longitude,
                    coords.latitude,
                ]
            );
            profileData = patientInsert.rows[0];
        } else if (effectiveRole === ROLES.BLOOD_BANK) {
            const name = bloodBankName || organizationName || fullName || 'Regional Blood Bank';
            const licenseNo = licenseNumber || ngoRegistrationNumber || `BB-${Date.now()}`;
            const director = directorName || coordinatorName || 'Chief Medical Officer';
            const contact = contactNumber || phone;
            const hours = operatingHours || '24/7';
            const address = bloodBankAddress || ngoAddress || locationName;

            const bbInsert = await client.query(
                `INSERT INTO blood_banks (
                    user_id, blood_bank_name, license_number, director_name, contact_number,
                    operating_hours, address, geom
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7,
                    ST_SetSRID(ST_MakePoint($8, $9), 4326)
                )
                RETURNING id, blood_bank_name, license_number, director_name, contact_number, operating_hours, address, verification_status;`,
                [
                    newUser.id,
                    name,
                    licenseNo,
                    director,
                    contact,
                    hours,
                    address,
                    coords.longitude,
                    coords.latitude,
                ]
            );
            profileData = bbInsert.rows[0];

            // Initialize 0 units for all 8 standard blood groups
            const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            for (const bg of bloodGroups) {
                await client.query(
                    `INSERT INTO blood_inventory (blood_bank_id, blood_group, units_available)
                     VALUES ($1, $2, 0)
                     ON CONFLICT DO NOTHING;`,
                    [profileData.id, bg]
                );
            }
        }

        await client.query('COMMIT');

        const token = generateToken(newUser);

        return apiSuccess(
            res,
            {
                token,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    role: newUser.role,
                    phone: newUser.phone,
                },
                profile: profileData,
            },
            'Registration successful! Welcome to the Blood Donor Matching Network.',
            201
        );
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

/**
 * Standard User Login (Donor, Hospital, Patient, NGO)
 */
const login = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const loginIdentifier = (email || username || '').toLowerCase().trim();

        if (!loginIdentifier || !password) {
            return apiError(res, 'Please provide both email/username and password.', 400);
        }

        // Query user by email
        const userRes = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [loginIdentifier]
        );

        if (userRes.rows.length === 0) {
            return apiError(res, 'Invalid credentials. Please verify your email and password.', 401);
        }

        const user = userRes.rows[0];

        if (!user.is_active) {
            return apiError(res, 'Your account is deactivated. Please contact support.', 403);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return apiError(res, 'Invalid credentials. Please verify your email and password.', 401);
        }

        // Fetch associated profile
        let profile = null;
        if (user.role === ROLES.DONOR) {
            const p = await db.query('SELECT * FROM donors WHERE user_id = $1', [user.id]);
            profile = p.rows[0] || null;
        } else if (user.role === ROLES.HOSPITAL) {
            const p = await db.query('SELECT * FROM hospitals WHERE user_id = $1', [user.id]);
            profile = p.rows[0] || null;
        } else if (user.role === ROLES.PATIENT) {
            const p = await db.query('SELECT * FROM patients WHERE user_id = $1', [user.id]);
            profile = p.rows[0] || null;
        } else if (user.role === ROLES.BLOOD_BANK || user.role === 'blood_bank' || user.role === 'ngo') {
            const p = await db.query('SELECT * FROM blood_banks WHERE user_id = $1', [user.id]);
            profile = p.rows[0] || null;
        }

        const token = generateToken(user);

        return apiSuccess(
            res,
            {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                },
                profile,
            },
            'Login successful.'
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Dedicated Admin Login
 */
const adminLogin = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const identifier = (email || username || '').toLowerCase().trim();

        if (!identifier || !password) {
            return apiError(res, 'Please provide username/email and password.', 400);
        }

        // Allow login by email or 'admin' fallback match
        const queryText = identifier.includes('@')
            ? 'SELECT * FROM users WHERE email = $1 AND role = $2'
            : 'SELECT * FROM users WHERE (email = $1 OR email LIKE $3) AND role = $2';

        const userRes = await db.query(
            queryText,
            identifier.includes('@')
                ? [identifier, ROLES.ADMIN]
                : [identifier, ROLES.ADMIN, 'admin%']
        );

        if (userRes.rows.length === 0) {
            return apiError(res, 'Unauthorized: Invalid Admin credentials.', 401);
        }

        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return apiError(res, 'Unauthorized: Invalid Admin credentials.', 401);
        }

        const token = generateToken(user);

        return apiSuccess(
            res,
            {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: 'Super Admin',
                },
            },
            'Admin authentication successful.'
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
    try {
        const user = req.user;
        let profile = null;

        if (user.role === ROLES.DONOR) {
            const p = await db.query(`
                SELECT id, full_name, blood_group, age, weight_kg, location_name,
                       availability_status, last_donation_date, emergency_ready, total_donations
                FROM donors WHERE user_id = $1;
            `, [user.id]);
            profile = p.rows[0] || null;
        } else if (user.role === ROLES.HOSPITAL) {
            const p = await db.query(`
                SELECT id, hospital_name, license_number, address, emergency_contact,
                       speciality, verification_status, verified_at
                FROM hospitals WHERE user_id = $1;
            `, [user.id]);
            profile = p.rows[0] || null;
        } else if (user.role === ROLES.PATIENT) {
            const p = await db.query(`
                SELECT id, full_name, blood_group, medical_condition, attending_doctor,
                       address, emergency_contact
                FROM patients WHERE user_id = $1;
            `, [user.id]);
            profile = p.rows[0] || null;
        } else if (user.role === ROLES.NGO) {
            const p = await db.query(`
                SELECT id, ngo_name, registration_number, coordinator_name, contact_number,
                       areas_of_operation, address, verification_status
                FROM ngos WHERE user_id = $1;
            `, [user.id]);
            profile = p.rows[0] || null;
        }

        return apiSuccess(res, {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                phone: user.phone,
            },
            profile,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout
 */
const logout = async (req, res) => {
    return apiSuccess(res, null, 'Logged out successfully.');
};

module.exports = {
    register,
    login,
    adminLogin,
    getMe,
    logout,
};

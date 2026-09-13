let bcrypt;
try {
    bcrypt = require('bcrypt');
} catch (e) {
    bcrypt = require('bcryptjs');
}
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const { ROLES } = require('../constants/roles');
const { resolveCoordinates } = require('../utils/geoUtils');
const { apiSuccess, apiError } = require('../utils/apiResponse');

/**
 * Generate JWT token with all authorized user roles
 */
const generateToken = (user, availableRoles = []) => {
    const roles = Array.from(new Set([user.role, ...(availableRoles || [])]));
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
            roles,
        },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
    );
};

/**
 * Fetch all registered profiles and active roles for a user
 */
const getUserProfilesAndRoles = async (userId, primaryRole) => {
    const [donorRes, patientRes, hospitalRes, bbRes, ngoRes] = await Promise.all([
        db.query('SELECT * FROM donors WHERE user_id = $1', [userId]),
        db.query('SELECT * FROM patients WHERE user_id = $1', [userId]),
        db.query('SELECT * FROM hospitals WHERE user_id = $1', [userId]),
        db.query('SELECT * FROM blood_banks WHERE user_id = $1', [userId]),
        db.query('SELECT * FROM ngos WHERE user_id = $1', [userId]),
    ]);

    const availableRoles = [];
    const profiles = {};

    if (donorRes.rows.length > 0) {
        availableRoles.push('donor');
        profiles.donor = donorRes.rows[0];
    }
    if (patientRes.rows.length > 0) {
        availableRoles.push('patient');
        profiles.patient = patientRes.rows[0];
    }
    if (hospitalRes.rows.length > 0) {
        availableRoles.push('hospital');
        profiles.hospital = hospitalRes.rows[0];
    }
    if (bbRes.rows.length > 0) {
        availableRoles.push('blood_bank');
        profiles.blood_bank = bbRes.rows[0];
    }
    if (ngoRes.rows.length > 0) {
        availableRoles.push('blood_bank');
        availableRoles.push('ngo');
        profiles.ngo = ngoRes.rows[0];
        if (!profiles.blood_bank) profiles.blood_bank = ngoRes.rows[0];
    }
    if (primaryRole === 'admin') {
        availableRoles.push('admin');
    }
    if (availableRoles.length === 0 && primaryRole) {
        availableRoles.push(primaryRole);
    }

    return {
        availableRoles: Array.from(new Set(availableRoles)),
        profiles,
    };
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

        // Check if caller is authenticated with a valid token
        let tokenUserId = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const bearerToken = authHeader.split(' ')[1];
                const decoded = jwt.verify(bearerToken, env.jwt.secret);
                tokenUserId = decoded.userId;
            } catch (err) {
                // Token invalid or expired, continue as guest
            }
        }

        // Check if user already exists
        const existingCheck = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        let targetUser = null;
        let isExistingUser = false;

        if (existingCheck.rows.length > 0) {
            const existingUser = existingCheck.rows[0];
            const isSelfAuthenticated = Boolean(tokenUserId && tokenUserId === existingUser.id);
            let isPasswordMatch = false;

            if (password) {
                isPasswordMatch = await bcrypt.compare(password, existingUser.password_hash);
            }

            // If not logged in as this user and password didn't match
            if (!isSelfAuthenticated && !isPasswordMatch) {
                return apiError(
                    res,
                    'An account with this email already exists. Please enter your existing account password to add this role, or sign in first.',
                    409
                );
            }

            // Check if user already has a profile for this role
            let tableToCheck = null;
            if (effectiveRole === ROLES.DONOR) tableToCheck = 'donors';
            else if (effectiveRole === ROLES.PATIENT) tableToCheck = 'patients';
            else if (effectiveRole === ROLES.HOSPITAL) tableToCheck = 'hospitals';
            else if (effectiveRole === ROLES.BLOOD_BANK || effectiveRole === 'ngo') tableToCheck = 'ngos';

            if (tableToCheck) {
                const roleExists = await client.query(
                    `SELECT id FROM ${tableToCheck} WHERE user_id = $1`,
                    [existingUser.id]
                );
                if (roleExists.rows.length > 0) {
                    return apiError(
                        res,
                        `You already have an active profile for ${effectiveRole.replace('_', ' ').toUpperCase()}. You can switch to this role directly from the Role Selection page.`,
                        400
                    );
                }
            }

            targetUser = existingUser;
            isExistingUser = true;
        } else {
            if (!password) {
                return apiError(res, 'Password is required to create a new account.', 400);
            }

            // Hash password securely with bcrypt (10 rounds)
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            const dbRole = (effectiveRole === 'blood_bank' || effectiveRole === ROLES.BLOOD_BANK) ? 'ngo' : effectiveRole;

            // Insert into users table
            const userInsert = await client.query(
                `INSERT INTO users (email, password_hash, role, phone)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, email, role, phone, is_active, created_at;`,
                [email.toLowerCase().trim(), passwordHash, dbRole, phone]
            );
            targetUser = userInsert.rows[0];
        }

        // Resolve coordinates with fallback
        const coords = resolveCoordinates(latitude, longitude);
        const locationName = location || hospitalAddress || ngoAddress || patientAddress || 'Pune, Maharashtra';

        await client.query('BEGIN');

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
                    targetUser.id,
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
                    targetUser.id,
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
                    targetUser.id,
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
        } else if (effectiveRole === ROLES.BLOOD_BANK || effectiveRole === 'ngo') {
            const name = bloodBankName || organizationName || fullName || 'Regional Blood Bank';
            const licenseNo = licenseNumber || ngoRegistrationNumber || `BB-${Date.now()}`;
            const director = directorName || coordinatorName || 'Director';
            const contact = req.body.contactNumber || emergencyContact || phone;
            const address = bloodBankAddress || ngoAddress || locationName;
            const areas = areasOfOperation || 'Pune District';

            const ngoInsert = await client.query(
                `INSERT INTO ngos (
                    user_id, ngo_name, registration_number, coordinator_name, contact_number,
                    areas_of_operation, address, geom
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7,
                    ST_SetSRID(ST_MakePoint($8, $9), 4326)
                )
                RETURNING id, ngo_name, registration_number, coordinator_name, contact_number, areas_of_operation, address, verification_status;`,
                [
                    targetUser.id,
                    name,
                    licenseNo,
                    director,
                    contact,
                    areas,
                    address,
                    coords.longitude,
                    coords.latitude,
                ]
            );
            profileData = ngoInsert.rows[0];
        }

        await client.query('COMMIT');

        const { availableRoles, profiles } = await getUserProfilesAndRoles(targetUser.id, targetUser.role);
        const token = generateToken(targetUser, availableRoles);

        const successMessage = isExistingUser
            ? `Successfully added ${effectiveRole.replace('_', ' ').toUpperCase()} role to your account! You can now log in and switch between roles.`
            : 'Registration successful! Welcome to the Blood Donor Matching Network.';

        return apiSuccess(
            res,
            {
                token,
                user: {
                    id: targetUser.id,
                    email: targetUser.email,
                    role: targetUser.role,
                    availableRoles,
                    phone: targetUser.phone,
                },
                profile: profileData,
                profiles,
            },
            successMessage,
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

        // Fetch associated profiles and all available roles
        const { availableRoles, profiles } = await getUserProfilesAndRoles(user.id, user.role);
        const token = generateToken(user, availableRoles);

        let profile = profiles[user.role] || null;
        if (!profile && availableRoles.length > 0) {
            profile = profiles[availableRoles[0]] || null;
        }

        return apiSuccess(
            res,
            {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    availableRoles,
                    phone: user.phone,
                },
                profile,
                profiles,
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

        const { availableRoles, profiles } = await getUserProfilesAndRoles(user.id, user.role);
        const token = generateToken(user, availableRoles);

        return apiSuccess(
            res,
            {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    availableRoles,
                    name: 'Super Admin',
                },
                profile: null,
                profiles,
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
        const { availableRoles, profiles } = await getUserProfilesAndRoles(user.id, user.role);
        const profile = profiles[user.role] || (availableRoles.length > 0 ? profiles[availableRoles[0]] : null);

        return apiSuccess(res, {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                availableRoles,
                phone: user.phone,
            },
            profile,
            profiles,
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
    getUserProfilesAndRoles,
};

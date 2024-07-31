const datastore = require('data-store')({ path: process.cwd() + '/data/auth.json' });
const db = require('./database');

/**
 * Get a user from their authentication token
 * @param {String} auth authentication token
 * @returns a user object, or null if the user does not exist
 */
function getUser(auth) {
    if (!auth || auth.length === 0) {
        return null;
    }
    
    const user = datastore.get(auth, null);
    if (!user || Object.keys(user).length === 0){
        return null;
    }
    return user;
}

/**
 * Login a user
 * @param {String} username username
 * @param {String} password password
 * @returns an object with a success property and an auth property if successful
 */
async function loginUser(username, password) {
    var result = await db.loginUser(username, password);
    console.log(result);
    if (result.success) {
        var auth = require('crypto').randomBytes(64).toString('hex');
        datastore.set(auth, result.user);
        return { success: true, auth: auth };
    } else {
        return { success: false, message: result.message };
    }
}

/**
 * Logout a user
 * @param {String} auth authentication token
 */
function logoutUser(auth) {
    datastore.del(auth);
}

module.exports = {
    getUser,
    loginUser,
    logoutUser
}
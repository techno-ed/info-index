const jwt = require('jsonwebtoken');

function isAdmin(req, res, next) {
    console.log('isAdmin middleware called');
    const token = req.cookies.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('User:', decoded);
            console.log('User role:', decoded.role);

            if (decoded.role === 'admin') {
                console.log('User is admin, proceeding to next middleware');
                req.user = decoded;
                next();
            } else {
                console.log('User is not admin, redirecting to home page');
                res.redirect('/');
            }
        } catch (error) {
            console.log('Invalid token, redirecting to login page');
            res.clearCookie('token');
            res.redirect('/login');
        }
    } else {
        console.log('No token found, redirecting to login page');
        res.redirect('/login');
    }
}

module.exports = isAdmin;

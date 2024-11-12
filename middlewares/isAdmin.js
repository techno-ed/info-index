const jwt = require('jsonwebtoken');

function isAdmin(req, res, next) {
    const token = req.cookies.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role === 'admin') {
                req.user = decoded;
                next();
            } else {
                res.redirect('/');
            }
        } catch (error) {
            res.clearCookie('token');
            res.redirect('/login');
        }
    } else {
        res.redirect('/login');
    }
}

module.exports = isAdmin;

const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    const token = req.headers.authorization

    if (!token) {
        return res.send({ error: true, message: 'Token is required', data: null });
    }


    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.send({ error: true, message: 'Bad token', data: null })
        } else {
            req.body.user = user
            next()
        }
    })
}
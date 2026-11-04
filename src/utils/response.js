const sendSuccess = (
    res,
    { data = null, message = 'Success', statusCode = 200 } = {}
) => res.status(statusCode).json({ success: true, message, data });

module.exports = { sendSuccess };

export default class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.status = statusCode;
    }
}

export const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.message = err.message || "Internal Server Error..."
    console.log('err-',err)
    if (err.name === "ValidationError") {
        const message = `${Object.values(err.errors)
            .map((error) => error.message)
            .join(", ")}`
        err = new ErrorHandler(message, 400);
    }
    if (err.name === "CastError") {
        const message = `Invelid ${err.path}`;
        err = new ErrorHandler(message, 400)
    }
    if (err.name === "JsonWebTokenError") {
        const message = `Json Web Token is Invelid, Try Again`;
        err = new ErrorHandler(message, 400)
    }
    if (err.name === "TokenExpiredError") {
        const message = `Json Web Token is Expired, Try Again`;
        err = new ErrorHandler(message, 400)
    }
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400)
    }
    return res.status(err.statusCode).json({
        message: err.message,
        success: false
    })
}
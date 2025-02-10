
export const sendToken =async (user, statusCode, message, res) => {
    const token = await user.generateToken();
    res.status(statusCode).cookie("token", token, {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 100
        ),
        httpOnly: true,
        secure: true
    }).json({
        sucess: true,
        message,
        token,
        user
    });
};
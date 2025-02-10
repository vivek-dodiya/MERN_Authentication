import nodeMailer from 'nodemailer'

export const sendEmail = async (email, subject, message) => {
    const transporter = nodeMailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        service: process.env.SMTP_SERVICE,
        secure: false, // or 'STARTTLS'
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASS
        }
    });
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: subject,
        html: message
    }
    try {
        await transporter.sendMail(mailOptions)
        console.log('Email sent')
    } catch (error) {
        console.log({message:'Error sending email', err : error.message})
    }

}



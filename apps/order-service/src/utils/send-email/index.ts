import nodemailer from "nodemailer";
import dotenv from "dotenv";
import ejs from "ejs";
import path from "path";

dotenv.config(); //reads a file called .env at the root of your project and loads the variables defined there into process.env.

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  service: process.env.SMTP_SERVICES,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// render an ejs email template
// dynamically load and render an email template using EJS (Embedded JavaScript Templates) with the provided data
// templateName: The filename of the email template (without the .ejs extension).
// data: A key-value object (like { name: "Shivani" }) that will be injected into the template.
// Returns: A Promise that resolves to the final rendered HTML string.
const renderEmailTemplate = async (
  templateName: string,
  data: Record<string, any>
): Promise<string> => {
  // path.join(...) builds the full path to the EJS file.
  // Example: If templateName is "verify-email", the final path becomes:
  // /your-project-root/auth-service/src/utils/email-templates/verify-email.ejs
  const templatePath = path.join(
    process.cwd(), // gets the current working directory (root of your project).
    "apps",
    "order-service",
    "src",
    "utils",
    "email-templates",
    `${templateName}.ejs`
  );
  //    reads the EJS file and injects the data into it.
  // It returns a rendered HTML string that can be used as the email body.
  return ejs.renderFile(templatePath, data);
};

//send an email using node mailer
export const sendEmail = async (
  to: string,
  subject: string,
  templateName: string,
  data: Record<string, any>
) => {
  try {
    // Renders an .ejs file to HTML with dynamic data.
    const html = await renderEmailTemplate(templateName, data);
    await transporter.sendMail({
      from: `<${process.env.SMTP_USER}`,
      to,
      subject,
      html,
    });
    return true; //If no error occurs, it returns true.
  } catch (error) {
    console.log("Error sending mail", error);
    return false;
  }
};

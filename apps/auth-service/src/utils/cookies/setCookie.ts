import { Response } from "express";
// HttpOnly cookies cannot be accessed via JavaScript (document.cookie), so they’re protected against XSS attacks.
// The browser automatically sends them with every request to the same domain, which is convenient for authentication

// name: The name/key of the cookie ("access_token" or "refresh_token").
// value: The value of the cookie (e.g., JWT token string).
export const setCookie = (res: Response, name: string, value: string) => {
  //   Calls Express’s res.cookie method to create a cookie with the given name, value, and options.
  res.cookie(name, value, {
    httpOnly: true, //prevent js access,helps prevent XSS attacks
    secure: true, //Cookie will only be sent over HTTPS.
    sameSite: "none", //"none" allows the cookie to be sent with cross-origin requests (needed if your frontend and backend are on different domains).
    maxAge: 7 * 24 * 60 * 60 * 1000, //Sets expiration time in milliseconds. 7 days × 24 hours × 60 minutes × 60 seconds × 1000 ms → cookie lasts 7 days.
    // Keep this cookie around for 7 days before deleting it
  });
};

// XSS (Cross-Site Scripting) is a type of web security vulnerability that allows attackers to inject malicious JavaScript into web pages viewed by other users.
// It usually happens when a website doesn’t properly sanitize user input and then displays it back to other users.
// The attacker’s malicious script runs in the victim’s browser, giving them access to sensitive data.

// The JWT acces token  inside the cookie is only valid for 15 minutes.
// But the cookie itself can live for 7 days.
// For the first 15 minutes, the cookie contains a valid JWT → requests succeed.
// After 15 minutes, the JWT inside the cookie is expired → requests fail with 401 Unauthorized.
// The cookie still exists in the browser (up to 7 days), but it’s holding an expired token.

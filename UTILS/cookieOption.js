export const cookieoptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // True in production (HTTPS)
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // None for cross-site
    path: "/",
}

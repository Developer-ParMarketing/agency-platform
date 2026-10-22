const authConfig = {
    pages: { signIn: "/login" },
    session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // 7 days
    trustHost: true,
    providers: [],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const onLoginPage = nextUrl.pathname.startsWith("/login");

            if (onLoginPage) {
                if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
                return true;
            }
            return isLoggedIn; // not logged in → sent to /login
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.team = user.team;
            }
            return token;
        },
        session({ session, token }) {
            session.user.id = token.id;
            session.user.role = token.role;
            session.user.team = token.team;
            return session;
        },
    },
};

export default authConfig;
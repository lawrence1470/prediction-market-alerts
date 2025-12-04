import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";

import { db } from "~/server/db";
import { env } from "~/env";

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      async sendVerificationOTP({ email, otp, type }) {
        await resend.emails.send({
          from: "Kalshi Tracker <noreply@resend.dev>",
          to: email,
          subject:
            type === "sign-in"
              ? `Your login code: ${otp}`
              : `Your verification code: ${otp}`,
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #000; margin-bottom: 20px;">Kalshi Tracker</h2>
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                ${type === "sign-in" ? "Use this code to sign in:" : "Use this code to verify your email:"}
              </p>
              <div style="background: #CDFF00; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #000;">${otp}</span>
              </div>
              <p style="color: #666; font-size: 14px;">
                This code expires in 5 minutes. If you didn't request this code, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;

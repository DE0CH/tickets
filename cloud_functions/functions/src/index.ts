import * as admin from "firebase-admin";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import https from "https";

admin.initializeApp();

const MAIL_API_URL = process.env.OX_MAIL_API_URL ?? "";
const MAIL_API_TOKEN = process.env.OX_MAIL_API_TOKEN ?? "";
const OX_EMAIL_RE = /@([A-Za-z0-9-]+\.)*ox\.ac\.uk$/i;

type MailApiResponse = {
  code?: string;
  error?: string;
};

const requestMailCode = (email: string) =>
  new Promise<MailApiResponse>((resolve, reject) => {
    if (!MAIL_API_URL || !MAIL_API_TOKEN) {
      reject(new Error("Missing OX_MAIL_API_URL or OX_MAIL_API_TOKEN."));
      return;
    }

    const url = new URL("/send_code", MAIL_API_URL);
    const body = JSON.stringify({ email });
    const options: https.RequestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        Authorization: `Bearer ${MAIL_API_TOKEN}`,
      },
    };

    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const payload = JSON.parse(data || "{}") as MailApiResponse;
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(payload);
          } else {
            reject(new Error(payload.error || "Mail API error."));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(body);
    req.end();
  });

export const requestOxfordCode = onCall(
  async (request: CallableRequest<{ email?: string }>) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Please log in first.");
    }

    const oxEmail = request.data?.email ?? "";
    const uid = request.auth.uid;

    if (!oxEmail || !OX_EMAIL_RE.test(oxEmail)) {
      throw new HttpsError(
        "invalid-argument",
        "Must be a valid Oxford University email.",
      );
    }

    try {
      const response = await requestMailCode(oxEmail);
      const code = response.code;
      if (!code) {
        throw new Error("Mail API did not return a code.");
      }

      await admin.firestore().collection("verificationCodes").doc(uid).set({
        code: code,
        email: oxEmail,
        attempts: 0,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      return { success: true };
    } catch (error) {
      logger.error("Mail API Error:", error);
      throw new HttpsError("internal", "Failed to send email.");
    }
  },
);

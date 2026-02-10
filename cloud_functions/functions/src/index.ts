import * as admin from "firebase-admin";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {defineSecret} from "firebase-functions/params";
import https from "https";

admin.initializeApp();

const MAIL_API_URL = defineSecret("OX_MAIL_API_URL");
const MAIL_API_TOKEN = defineSecret("OX_MAIL_API_TOKEN");
const OX_EMAIL_RE = /@([A-Za-z0-9-]+\.)*ox\.ac\.uk$/i;

type MailApiResponse = {
  code?: string;
  error?: string;
};

const requestMailCode = (email: string) =>
  new Promise<MailApiResponse>((resolve, reject) => {
    const mailApiUrl = MAIL_API_URL.value();
    const mailApiToken = MAIL_API_TOKEN.value();
    if (!mailApiUrl || !mailApiToken) {
      reject(new Error("Missing OX_MAIL_API_URL or OX_MAIL_API_TOKEN."));
      return;
    }

    const url = new URL("/send_code", mailApiUrl);
    const body = JSON.stringify({email});
    const options: https.RequestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "Authorization": `Bearer ${mailApiToken}`,
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
  {
    secrets: [MAIL_API_URL, MAIL_API_TOKEN],
  },
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

      return {success: true};
    } catch (error) {
      logger.error("Mail API Error:", error);
      throw new HttpsError("internal", "Failed to send email.");
    }
  },
);

export const verifyOxfordCode = onCall(
  async (request: CallableRequest<{ code?: string }>) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Please log in first.");
    }

    const code = request.data?.code?.trim() ?? "";
    if (!code) {
      throw new HttpsError("invalid-argument", "Code is required.");
    }

    const uid = request.auth.uid;
    const codeRef = admin.firestore().collection("verificationCodes").doc(uid);
    const codeSnap = await codeRef.get();
    if (!codeSnap.exists) {
      throw new HttpsError("failed-precondition", "No code found.");
    }

    const data = codeSnap.data() ?? {};
    const storedCode = String(data.code ?? "");
    const expiresAt = Number(data.expiresAt ?? 0);
    if (!storedCode) {
      throw new HttpsError("failed-precondition", "No code found.");
    }
    if (expiresAt && Date.now() > expiresAt) {
      throw new HttpsError("deadline-exceeded", "Code expired.");
    }
    if (storedCode !== code) {
      const attempts = Number(data.attempts ?? 0) + 1;
      await codeRef.set(
        {
          attempts: attempts,
        },
        {merge: true},
      );
      if (attempts >= 5) {
        throw new HttpsError(
          "permission-denied",
          "Too many attempts. Request a new code.",
        );
      }
      throw new HttpsError("permission-denied", "Invalid code.");
    }

    await admin.firestore().collection("users").doc(uid).set(
      {
        oxford_email_verified: true,
        oxford_email_verified_at:
          admin.firestore.FieldValue.serverTimestamp(),
        oxford_email: data.email ?? null,
      },
      {merge: true},
    );

    return {success: true};
  },
);

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const https = require("https");

admin.initializeApp();

const MAIL_API_URL = process.env.OX_MAIL_API_URL || "";
const MAIL_API_TOKEN = process.env.OX_MAIL_API_TOKEN || "";

const requestMailCode = (email) =>
  new Promise((resolve, reject) => {
    if (!MAIL_API_URL || !MAIL_API_TOKEN) {
      reject(new Error("Missing OX_MAIL_API_URL or OX_MAIL_API_TOKEN."));
      return;
    }

    const url = new URL("/send_code", MAIL_API_URL);
    const body = JSON.stringify({ email });
    const options = {
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
          const payload = JSON.parse(data || "{}");
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

exports.requestOxfordCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.auth.HttpsError("unauthenticated", "Please log in first.");
  }

  const oxEmail = data.email;
  const uid = context.auth.uid;

  if (!oxEmail || !oxEmail.endsWith("ox.ac.uk")) {
    throw new functions.auth.HttpsError("invalid-argument", "Must be a valid Oxford University email.");
  }

  let code;

  try {
    const response = await requestMailCode(oxEmail);
    code = response.code;
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
    console.error("Mail API Error:", error);
    throw new functions.auth.HttpsError("internal", "Failed to send email.");
  }
});

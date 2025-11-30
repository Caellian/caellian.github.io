import { json } from "@sveltejs/kit";

export async function GET() {
  return json({
    botToken: process.env.TG_BOT_TOKEN ? "Set" : "Not Set",
    chatId: process.env.TG_CHAT_ID ? "Set" : "Not Set",
  });
}

export async function POST({ request }) {
  console.log("--- send-message function invoked ---");
  try {
    const { name, email, message } = await request.json();

    const botToken = process.env.TG_BOT_TOKEN;
    const chatId = process.env.TG_CHAT_ID;

    if (!botToken || !chatId) {
      console.error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set.");
      return json(
        { success: false, error: "Telegram bot token or chat ID is not set." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Name: ${name}\nEmail: ${email}\nMessage:\n\n${message}`,
        }),
      }
    );

    const responseBody = await response.text();

    if (response.ok) {
      return json({ success: true });
    } else {
      console.error("Failed to send message.");
      return json(
        { success: false, error: responseBody },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Error in send-message function:", error.message);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
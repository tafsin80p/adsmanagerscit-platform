import connectDB from "@/lib/mongodb";
import { SettingModel } from "@/models";

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  webhookUrl?: string;
}

export type TelegramInlineButton =
  | { text: string; url: string; callback_data?: never }
  | { text: string; callback_data: string; url?: never };

export function escapeHtml(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Retrieves the active Telegram configuration from MongoDB settings or environment variables.
 */
export async function getTelegramConfig(): Promise<TelegramConfig> {
  let botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  let chatId = process.env.TELEGRAM_CHAT_ID || "";
  let webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || "";
  let enabled = true;

  try {
    await connectDB();
    const settings = await SettingModel.findOne({ key: "global_settings" }).lean();
    if (settings) {
      if (settings.telegramBotToken) {
        botToken = settings.telegramBotToken.trim();
      }
      if (settings.telegramChatId) {
        chatId = settings.telegramChatId.trim();
      }
      if (settings.telegramWebhookUrl) {
        webhookUrl = settings.telegramWebhookUrl.trim();
      }
      if (settings.telegramEnabled !== undefined) {
        enabled = Boolean(settings.telegramEnabled);
      }
    }
  } catch (err) {
    console.warn("[Telegram] Could not read settings from MongoDB:", err);
  }

  return {
    botToken,
    chatId,
    enabled,
    webhookUrl,
  };
}

export interface SendTelegramOptions {
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  photoUrl?: string;
  inlineKeyboard?: TelegramInlineButton[][];
  botTokenOverride?: string;
  chatIdOverride?: string;
}

/**
 * Sends a message (and photo if provided) to one or multiple Telegram chats/groups.
 */
export async function sendTelegramMessage(
  text: string,
  options?: SendTelegramOptions
): Promise<{ success: boolean; delivered: number; errors: string[] }> {
  const config = await getTelegramConfig();
  const botToken = (options?.botTokenOverride || config.botToken).trim();
  const rawChatId = (options?.chatIdOverride || config.chatId).trim();

  if (!config.enabled && !options?.botTokenOverride) {
    console.log("[Telegram] Notifications are currently disabled in settings.");
    return { success: false, delivered: 0, errors: ["Telegram notifications disabled"] };
  }

  if (!botToken) {
    console.log("[Telegram] No Telegram Bot Token configured. Skipping notification.");
    return { success: false, delivered: 0, errors: ["Missing bot token"] };
  }

  if (!rawChatId) {
    console.log("[Telegram] No Telegram Chat/Group ID configured. Skipping notification.");
    return { success: false, delivered: 0, errors: ["Missing chat ID"] };
  }

  // Parse chat IDs (supports comma/space/semicolon separated IDs for personal + groups)
  const chatIds = rawChatId
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);

  if (chatIds.length === 0) {
    return { success: false, delivered: 0, errors: ["No valid chat IDs parsed"] };
  }

  const errors: string[] = [];
  let delivered = 0;

  for (const targetChatId of chatIds) {
    let sentPhotoSuccess = false;

    // 1. If photoUrl is supplied, attempt sendPhoto first
    if (options?.photoUrl && options.photoUrl.startsWith("http")) {
      try {
        const photoPayload: Record<string, any> = {
          chat_id: targetChatId,
          photo: options.photoUrl,
          caption: text.slice(0, 1024), // Telegram caption max limit is 1024 chars
          parse_mode: options?.parseMode || "HTML",
        };

        if (options?.inlineKeyboard && options.inlineKeyboard.length > 0) {
          photoPayload.reply_markup = {
            inline_keyboard: options.inlineKeyboard,
          };
        }

        const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(photoPayload),
        });

        const photoData = await photoRes.json();
        if (photoRes.ok && photoData.ok) {
          delivered++;
          sentPhotoSuccess = true;
        } else {
          console.warn(
            `[Telegram] sendPhoto failed for ${targetChatId} (${photoData.description}). Falling back to text message.`
          );
        }
      } catch (err: unknown) {
        console.warn(`[Telegram] sendPhoto exception for ${targetChatId}:`, err);
      }
    }

    // 2. If photo wasn't sent (or not provided), send as standard sendMessage
    if (!sentPhotoSuccess) {
      try {
        let messageText = text;
        // If photoUrl was provided but sendPhoto failed, append image link
        if (options?.photoUrl && options.photoUrl.startsWith("http")) {
          messageText += `\n\n📸 <a href="${options.photoUrl}">View Attached Screenshot / Proof</a>`;
        }

        const msgPayload: Record<string, any> = {
          chat_id: targetChatId,
          text: messageText,
          parse_mode: options?.parseMode || "HTML",
          disable_web_page_preview: false,
        };

        if (options?.inlineKeyboard && options.inlineKeyboard.length > 0) {
          msgPayload.reply_markup = {
            inline_keyboard: options.inlineKeyboard,
          };
        }

        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(msgPayload),
        });

        const data = await res.json();
        if (res.ok && data.ok) {
          delivered++;
        } else {
          const errMsg = data.description || `HTTP ${res.status}`;
          errors.push(`Chat ${targetChatId}: ${errMsg}`);
          console.error(`[Telegram] sendMessage failed for ${targetChatId}:`, errMsg);
        }
      } catch (err: unknown) {
        const error = err as Error;
        errors.push(`Chat ${targetChatId}: ${error.message}`);
        console.error(`[Telegram] Network error sending to ${targetChatId}:`, err);
      }
    }
  }

  return {
    success: delivered > 0,
    delivered,
    errors,
  };
}

/**
 * Answers a Telegram callback query with a toast notification or alert box.
 */
export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text: string,
  showAlert = false,
  botTokenOverride?: string
): Promise<boolean> {
  const config = await getTelegramConfig();
  const token = botTokenOverride || config.botToken;
  if (!token) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
    const data = await res.json();
    return Boolean(res.ok && data.ok);
  } catch (err) {
    console.error("[Telegram] answerCallbackQuery error:", err);
    return false;
  }
}

/**
 * Edits a previously sent Telegram message or photo caption to reflect order state changes.
 */
export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  options?: {
    parseMode?: "HTML" | "Markdown";
    inlineKeyboard?: TelegramInlineButton[][];
    isCaption?: boolean;
    botTokenOverride?: string;
  }
): Promise<boolean> {
  const config = await getTelegramConfig();
  const token = options?.botTokenOverride || config.botToken;
  if (!token) return false;

  const endpoint = options?.isCaption
    ? `https://api.telegram.org/bot${token}/editMessageCaption`
    : `https://api.telegram.org/bot${token}/editMessageText`;

  const payload: Record<string, any> = {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: options?.parseMode || "HTML",
  };

  if (options?.isCaption) {
    payload.caption = text.slice(0, 1024);
  } else {
    payload.text = text;
    payload.disable_web_page_preview = false;
  }

  if (options?.inlineKeyboard) {
    payload.reply_markup = {
      inline_keyboard: options.inlineKeyboard,
    };
  } else {
    // Clear buttons if inlineKeyboard is empty array
    payload.reply_markup = {
      inline_keyboard: [],
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return Boolean(res.ok && data.ok);
  } catch (err) {
    console.error("[Telegram] editTelegramMessage error:", err);
    return false;
  }
}

/**
 * Registers a Webhook URL with Telegram Bot API to listen for button clicks & updates.
 */
export async function setTelegramWebhook(
  webhookUrl: string,
  botTokenOverride?: string
): Promise<{ success: boolean; description?: string }> {
  const config = await getTelegramConfig();
  const token = (botTokenOverride || config.botToken).trim();
  if (!token) return { success: false, description: "No Telegram Bot Token provided." };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
      }),
    });
    const data = await res.json();
    return { success: Boolean(res.ok && data.ok), description: data.description };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, description: error.message };
  }
}

/**
 * Retrieves current Telegram Webhook registration status.
 */
export async function getTelegramWebhookInfo(
  botTokenOverride?: string
): Promise<{
  success: boolean;
  url?: string;
  hasCustomCertificate?: boolean;
  pendingUpdateCount?: number;
  lastErrorDate?: number;
  lastErrorMessage?: string;
  description?: string;
}> {
  const config = await getTelegramConfig();
  const token = (botTokenOverride || config.botToken).trim();
  if (!token) return { success: false, description: "No Telegram Bot Token provided." };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();
    if (res.ok && data.ok && data.result) {
      return {
        success: true,
        url: data.result.url || "",
        hasCustomCertificate: data.result.has_custom_certificate,
        pendingUpdateCount: data.result.pending_update_count,
        lastErrorDate: data.result.last_error_date,
        lastErrorMessage: data.result.last_error_message,
      };
    }
    return { success: false, description: data.description };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, description: error.message };
  }
}

/**
 * Formats and broadcasts an instant alert when a new order is received,
 * equipped with interactive one-click Confirm & Reject buttons for Telegram group admins.
 */
export async function notifyNewOrderTelegram(order: any): Promise<boolean> {
  try {
    const orderId = order.id || "NEW-ORDER";
    const campaignName = order.campaignName || "Untitled Campaign";
    const clientName = order.clientName || order.businessName || "Valued Client";
    const pageName = order.facebookPageName || "Connected FB Page";
    const pageId = order.facebookPageId || "";
    const clientEmail = order.clientEmail || "Not provided";
    const postType = order.postType || "Boost Post";
    const objective = order.objective || "Messages";
    const dailyBudget = Number(order.dailyBudgetUSD || 0).toFixed(2);
    const durationDays = Number(order.durationDays || 1);
    const totalUSD = Number(order.totalBudgetUSD || 0).toFixed(2);
    const totalBDT = Number(order.paidAmountBDT || 0).toLocaleString();
    const paymentMethod = order.paymentMethod || "bKash";
    const paymentStatus = order.paymentStatus || "Awaiting Verification";
    const transactionId = order.transactionId || "N/A";
    const postUrl = order.postUrl || "";
    const notes = Array.isArray(order.notes) && order.notes.length > 0 ? order.notes[0] : "";

    const message = `
🚀 <b>NEW META ADS ORDER RECEIVED!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>Order ID:</b> <code>#${escapeHtml(orderId)}</code>
🏷️ <b>Campaign:</b> <b>${escapeHtml(campaignName)}</b>
🎯 <b>Category:</b> ${escapeHtml(postType)} (${escapeHtml(objective)})

👤 <b>Client:</b> ${escapeHtml(clientName)}
🏢 <b>Brand / Page:</b> ${escapeHtml(pageName)}${pageId ? `\n🆔 <b>Page ID:</b> <code>${escapeHtml(pageId)}</code>` : ""}
📧 <b>Email:</b> <code>${escapeHtml(clientEmail)}</code>

💰 <b>Budget & Schedule:</b>
• Strategy: <b>${order.budgetType === "total" ? "Lifetime / Total Budget" : "Daily Budget"}</b>
• Duration: ${durationDays} Days
• Daily Pace: $${dailyBudget} USD / Day
• Total USD: <b>$${totalUSD} USD</b>
• Total BDT: <b>৳${totalBDT} BDT</b>

💳 <b>Payment Details:</b>
• Method: <b>${escapeHtml(paymentMethod)}</b>
• Status: <b>${escapeHtml(paymentStatus)}</b>
• TrxID: <code>${escapeHtml(transactionId)}</code>
${notes ? `\n📝 <b>Specialist Note:</b>\n<i>${escapeHtml(notes)}</i>` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 <i>Tap below to verify payment & confirm order instantly without logging into admin:</i>
`.trim();

    const config = await getTelegramConfig();
    let siteOrigin = "https://shopnocareerit.com";
    if (config.webhookUrl && config.webhookUrl.startsWith("http")) {
      try {
        const parsed = new URL(config.webhookUrl);
        siteOrigin = parsed.origin;
      } catch { }
    } else if (process.env.NEXTAUTH_URL) {
      siteOrigin = process.env.NEXTAUTH_URL.replace(/\/$/, "");
    }

    // Interactive Action Buttons (both Callback & Direct 1-Click URL)
    const inlineKeyboard: TelegramInlineButton[][] = [
      [
        { text: "✅ Confirm & Activate Order", callback_data: `confirm:${orderId}` },
        { text: "❌ Reject", callback_data: `reject:${orderId}` },
      ],
      [
        {
          text: "⚡ 1-Click Instant Confirm (No Login)",
          url: `${siteOrigin}/api/telegram/action?action=confirm&orderId=${encodeURIComponent(orderId)}`,
        },
      ],
    ];

    if (postUrl && postUrl.startsWith("http")) {
      inlineKeyboard.push([{ text: "🔗 View Post Creative", url: postUrl }]);
    }

    const result = await sendTelegramMessage(message, {
      parseMode: "HTML",
      photoUrl: order.screenshotUrl || undefined,
      inlineKeyboard,
    });

    return result.success;
  } catch (err) {
    console.error("[Telegram] Error triggering order notification:", err);
    return false;
  }
}

/**
 * Processes pending Telegram callback updates (e.g. when webhook is not yet set or during local testing).
 * Reads Telegram's getUpdates queue, processes button clicks (confirm/reject), updates MongoDB Atlas,
 * and clears processed items so nothing is missed.
 */
export async function processTelegramPendingUpdates(): Promise<number> {
  const config = await getTelegramConfig();
  if (!config.botToken || !config.enabled) return 0;

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/getUpdates?limit=20&timeout=0`);
    const data = await res.json();
    if (!res.ok || !data.ok || !Array.isArray(data.result) || data.result.length === 0) {
      return 0;
    }

    const { OrderModel, PaymentModel } = await import("@/models");
    let maxProcessedUpdateId = -1;
    let processedCount = 0;

    for (const update of data.result) {
      if (update.update_id > maxProcessedUpdateId) {
        maxProcessedUpdateId = update.update_id;
      }

      if (update.callback_query) {
        const cq = update.callback_query;
        const callbackId = cq.id;
        const cqData = cq.data || "";
        const fromUser = cq.from;
        const message = cq.message;

        const responder = fromUser.username
          ? `@${fromUser.username}`
          : [fromUser.first_name, fromUser.last_name].filter(Boolean).join(" ") || "Admin";

        if (cqData === "info_done") {
          await answerTelegramCallbackQuery(callbackId, "This order status has already been updated.", false);
          continue;
        }

        const colonIndex = cqData.indexOf(":");
        if (colonIndex !== -1) {
          const action = cqData.slice(0, colonIndex);
          const orderId = cqData.slice(colonIndex + 1);

          const order = await OrderModel.findOne({ id: orderId });
          if (order) {
            const nowFormatted = new Date().toLocaleString("en-US", {
              timeZone: "Asia/Dhaka",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            if (action === "confirm") {
              await OrderModel.findOneAndUpdate(
                { id: order.id },
                { $set: { status: "Active", paymentStatus: "Verified" } }
              );

              await PaymentModel.findOneAndUpdate(
                { orderId: order.id },
                { $set: { status: "Verified" } }
              );

              await answerTelegramCallbackQuery(
                callbackId,
                `✅ Order #${order.id} verified & activated successfully!`,
                false
              );

              if (message) {
                const chatId = message.chat.id;
                const messageId = message.message_id;
                const isCaption = Boolean(message.caption && !message.text);
                const originalBody = (message.caption || message.text || "").replace(
                  /━━━━━━━━━━━━━━━━━━━━━━━━━━\s*👇[\s\S]*$/g,
                  ""
                ).trim();

                const updatedMessage = `
${originalBody}
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>ORDER CONFIRMED & ACTIVATED</b>
👤 <b>Verified by:</b> <b>${escapeHtml(responder)}</b>
🕒 <b>Verified on:</b> ${nowFormatted}
⚡ <i>Payment marked as Verified in MongoDB database.</i>
`.trim();

                const updatedButtons: any[][] = [
                  [{ text: "🟢 Order Active & Verified", callback_data: "info_done" }],
                ];
                if (order.postUrl && order.postUrl.startsWith("http")) {
                  updatedButtons.push([{ text: "🔗 View Post Creative", url: order.postUrl }]);
                }

                await editTelegramMessage(chatId, messageId, updatedMessage, {
                  isCaption,
                  parseMode: "HTML",
                  inlineKeyboard: updatedButtons,
                });
              }

              processedCount++;
            } else if (action === "reject") {
              await OrderModel.findOneAndUpdate(
                { id: order.id },
                { $set: { status: "Rejected", paymentStatus: "Failed" } }
              );

              await PaymentModel.findOneAndUpdate(
                { orderId: order.id },
                { $set: { status: "Failed" } }
              );

              await answerTelegramCallbackQuery(
                callbackId,
                `❌ Order #${order.id} marked as Rejected.`,
                false
              );

              processedCount++;
            }
          }
        }
      }
    }

    // Acknowledge processed updates so Telegram clears them from queue
    if (maxProcessedUpdateId > 0) {
      await fetch(
        `https://api.telegram.org/bot${config.botToken}/getUpdates?offset=${maxProcessedUpdateId + 1}&limit=1`
      ).catch(() => { });
    }

    return processedCount;
  } catch (err) {
    console.warn("[Telegram] Error processing pending updates:", err);
    return 0;
  }
}

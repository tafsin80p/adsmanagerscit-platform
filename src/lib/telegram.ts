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

let cachedTelegramConfig: { config: TelegramConfig; timestamp: number } | null = null;

/**
 * Retrieves the active Telegram configuration from MongoDB settings or environment variables.
 */
export async function getTelegramConfig(forceFresh = false): Promise<TelegramConfig> {
  const now = Date.now();
  if (!forceFresh && cachedTelegramConfig && now - cachedTelegramConfig.timestamp < 30000) {
    return cachedTelegramConfig.config;
  }

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

  const result = {
    botToken,
    chatId,
    enabled,
    webhookUrl,
  };

  cachedTelegramConfig = { config: result, timestamp: now };
  return result;
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
    const hasPhoto = Boolean(options?.photoUrl && options.photoUrl.startsWith("http"));
    const isLongText = (text || "").length > 1000;

    // 1. If photoUrl is supplied and text fits inside 1000 chars, send as single photo with caption
    if (hasPhoto && !isLongText) {
      try {
        const photoPayload: Record<string, any> = {
          chat_id: targetChatId,
          photo: options!.photoUrl,
          caption: text,
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
            `[Telegram] sendPhoto failed for ${targetChatId} (${photoData.description}). Falling back to separate text message.`
          );
        }
      } catch (err: unknown) {
        console.warn(`[Telegram] sendPhoto exception for ${targetChatId}:`, err);
      }
    } else if (hasPhoto && isLongText) {
      // 2. Long text: send photo preview first with a concise caption, then send full detailed message with buttons
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChatId,
            photo: options!.photoUrl,
            caption: "📸 <b>Attached Payment Receipt / Screenshot Proof</b>",
            parse_mode: "HTML",
          }),
        });
      } catch (photoErr) {
        console.warn(`[Telegram] Long-text photo preview failed for ${targetChatId}:`, photoErr);
      }
    }

    // 3. If photo wasn't sent with the full text, send full text message
    if (!sentPhotoSuccess) {
      try {
        let messageText = text;
        // If photo was provided but not sent as photo, append link
        if (hasPhoto && !isLongText) {
          messageText += `\n\n📸 <a href="${options!.photoUrl}">View Attached Screenshot / Proof</a>`;
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
        } else if (data.parameters?.migrate_to_chat_id) {
          // Auto-heal: Group upgraded to supergroup, auto-retry with migrated supergroup ID & persist to MongoDB
          const migratedChatId = String(data.parameters.migrate_to_chat_id);
          console.log(`[Telegram] Chat ${targetChatId} migrated to supergroup ${migratedChatId}. Resending...`);
          msgPayload.chat_id = migratedChatId;
          const retryRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msgPayload),
          });
          const retryData = await retryRes.json();
          if (retryRes.ok && retryData.ok) {
            delivered++;
            try {
              await SettingModel.updateOne(
                { key: "global_settings" },
                { $set: { telegramChatId: migratedChatId, updatedAt: new Date() } }
              );
            } catch { }
          } else {
            const errMsg = retryData.description || `HTTP ${retryRes.status}`;
            errors.push(`Chat ${migratedChatId}: ${errMsg}`);
          }
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
 * Constructs inline URL buttons for all post creatives associated with an order.
 * If the order contains multiple items, it creates labeled buttons for each post.
 */
export function buildPostCreativeButtons(order: any): TelegramInlineButton[][] {
  const buttons: TelegramInlineButton[][] = [];
  const items: any[] = Array.isArray(order?.items) && order.items.length > 0 ? order.items : [];

  if (items.length > 0) {
    const postButtons: TelegramInlineButton[] = [];
    items.forEach((item, idx) => {
      const url = (item.postUrl || "").trim();
      if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
        const title = items.length === 1 ? "🔗 View Post Creative" : `🔗 Post #${idx + 1} Creative`;
        postButtons.push({ text: title, url });
      }
    });

    // Group buttons into rows of max 2 buttons per row for mobile readability
    for (let i = 0; i < postButtons.length; i += 2) {
      buttons.push(postButtons.slice(i, i + 2));
    }
  } else if (order?.postUrl && (order.postUrl.startsWith("http://") || order.postUrl.startsWith("https://"))) {
    buttons.push([{ text: "🔗 View Post Creative", url: order.postUrl.trim() }]);
  }

  return buttons;
}

/**
 * Formats and broadcasts an instant alert when a new order is received,
 * equipped with interactive one-click Confirm & Reject buttons for Telegram group admins.
 * If multiple posts are included, clearly outlines post count and each individual post's details.
 */
export async function notifyNewOrderTelegram(order: any, originOverride?: string): Promise<boolean> {
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
    const specialNoteText =
      order.specialNote?.trim() ||
      (Array.isArray(order.notes)
        ? order.notes.find((n: string) => n && !n.startsWith("Order created by") && !n.startsWith("Client submitted") && !n.startsWith("Target objective:") && !n.startsWith("Payment submitted") && !n.startsWith("Sender Account:")) || order.notes[0]
        : typeof order.notes === "string" ? order.notes : "");
    const items: any[] = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
    const postCount = items.length > 0 ? items.length : 1;

    // Build targeted posts section with rich details for each individual post
    let postsSection = "";
    if (items.length > 1) {
      postsSection = `\n📋 <b>TARGET POSTS TO BOOST (${items.length} Posts):</b>\n`;
      items.forEach((item, idx) => {
        const itemNum = idx + 1;
        const itemName = item.name ? item.name : `Post #${itemNum}`;
        const itemObj = item.objective || objective;
        const itemDaily = Number(item.dailyBudgetUSD || 0).toFixed(2);
        const itemDays = Number(item.durationDays || durationDays);
        const itemTotal = Number(
          item.totalBudgetUSD || (Number(itemDaily) * itemDays)
        ).toFixed(2);
        const itemUrl = (item.postUrl || "").trim();

        postsSection += `\n📌 <b>Post #${itemNum}: ${escapeHtml(itemName)}</b>\n`;
        postsSection += `• Objective: <b>${escapeHtml(itemObj)}</b>\n`;
        if (item.budgetType === "total") {
          postsSection += `• Budget: <b>Total $${itemTotal} USD</b> (${itemDays}d, ~$${itemDaily}/day)\n`;
        } else {
          postsSection += `• Budget: <b>$${itemDaily}/day × ${itemDays}d = $${itemTotal} USD</b>\n`;
        }
        if (itemUrl && (itemUrl.startsWith("http://") || itemUrl.startsWith("https://"))) {
          postsSection += `• Creative: <a href="${escapeHtml(itemUrl)}">Open Facebook Post ↗</a>\n`;
        } else {
          postsSection += `• Creative: <i>No link provided</i>\n`;
        }
      });
    } else if (items.length === 1) {
      const singleItem = items[0];
      const singleUrl = (singleItem.postUrl || postUrl || "").trim();
      const singleName = singleItem.name || campaignName;
      const singleObj = singleItem.objective || objective;
      postsSection = `\n📋 <b>TARGET POST CREATIVE (1 Post):</b>\n`;
      postsSection += `📌 <b>${escapeHtml(singleName)}</b>\n`;
      postsSection += `• Objective: <b>${escapeHtml(singleObj)}</b>\n`;
      if (singleUrl && (singleUrl.startsWith("http://") || singleUrl.startsWith("https://"))) {
        postsSection += `• Creative: <a href="${escapeHtml(singleUrl)}">Open Facebook Post ↗</a>\n`;
      } else {
        postsSection += `• Creative: <i>No link provided</i>\n`;
      }
    } else {
      postsSection = `\n🔗 <b>Target Post Creative:</b>\n`;
      if (postUrl && (postUrl.startsWith("http://") || postUrl.startsWith("https://"))) {
        postsSection += `• Creative: <a href="${escapeHtml(postUrl)}">Open Facebook Post ↗</a>\n`;
      } else {
        postsSection += `• Creative: <i>No link provided</i>\n`;
      }
    }

    const message = `
🚀 <b>NEW META ADS ORDER RECEIVED!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>Order ID:</b> <code>#${escapeHtml(orderId)}</code>
🏷️ <b>Campaign:</b> <b>${escapeHtml(campaignName)}</b>
🎯 <b>Category:</b> ${escapeHtml(postType)} (${escapeHtml(objective)})
📊 <b>Posts Count:</b> <b>${postCount} Post${postCount > 1 ? "s to Boost" : " to Boost"}</b>

👤 <b>Client:</b> ${escapeHtml(clientName)}
🏢 <b>Brand / Page:</b> ${escapeHtml(pageName)}${pageId ? `\n🆔 <b>Page ID:</b> <code>${escapeHtml(pageId)}</code>` : ""}
📧 <b>Email:</b> <code>${escapeHtml(clientEmail)}</code>
${postsSection.trim()}

💰 <b>Overall Order Budget:</b>
• Strategy: <b>${order.budgetType === "total" ? "Lifetime / Total Budget" : "Daily Pace"}</b>
• Duration: ${durationDays} Days
• Daily Pace: $${dailyBudget} USD / Day
• Total USD: <b>$${totalUSD} USD</b>
• Total BDT: <b>৳${totalBDT} BDT</b>

💳 <b>Payment Details:</b>
• Method: <b>${escapeHtml(paymentMethod)}</b>
• Status: <b>${escapeHtml(paymentStatus)}</b>
• TrxID: <code>${escapeHtml(transactionId)}</code>
${specialNoteText ? `\n📝 <b>Special Note / Instructions:</b>\n<i>${escapeHtml(specialNoteText)}</i>` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 <i>Tap below to verify payment & confirm order instantly without logging into admin:</i>
`.trim();

    const config = await getTelegramConfig();
    let siteOrigin = originOverride || "";

    if (!siteOrigin) {
      if (config.webhookUrl && config.webhookUrl.startsWith("http")) {
        try {
          const parsed = new URL(config.webhookUrl);
          siteOrigin = parsed.origin;
        } catch { }
      } else if (process.env.NEXTAUTH_URL) {
        siteOrigin = process.env.NEXTAUTH_URL.replace(/\/$/, "");
      } else if (process.env.NEXT_PUBLIC_APP_URL) {
        siteOrigin = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
      } else if (process.env.VERCEL_URL) {
        siteOrigin = `https://${process.env.VERCEL_URL}`;
      } else {
        siteOrigin = "https://adsmanager.shopnocareerit.com";
      }
    }

    // Auto-ensure Telegram webhook is set to this live production URL
    if (siteOrigin.startsWith("https://") && config.botToken) {
      const expectedWebhook = `${siteOrigin}/api/telegram/webhook`;
      if (config.webhookUrl !== expectedWebhook) {
        setTelegramWebhook(expectedWebhook, config.botToken).catch(() => {});
      }
    }

    const confirmUrl = `${siteOrigin}/api/telegram/action?action=confirm&orderId=${encodeURIComponent(orderId)}`;
    const rejectUrl = `${siteOrigin}/api/telegram/action?action=reject&orderId=${encodeURIComponent(orderId)}`;

    // Interactive Action Buttons (both Callback & Direct 1-Click URL)
    const inlineKeyboard: TelegramInlineButton[][] = [
      [
        {
          text: "⚡ 1-Click Confirm & Activate (Instant)",
          url: confirmUrl,
        },
      ],
      [
        { text: "✅ Confirm & Activate Order", callback_data: `confirm:${orderId}` },
        { text: "❌ Reject", callback_data: `reject:${orderId}` },
      ],
    ];

    // Append individual post creative buttons
    const postButtons = buildPostCreativeButtons(order);
    if (postButtons.length > 0) {
      inlineKeyboard.push(...postButtons);
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
                const postButtons = buildPostCreativeButtons(order);
                if (postButtons.length > 0) {
                  updatedButtons.push(...postButtons);
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

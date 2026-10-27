import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SettingModel } from "@/models";

export async function POST(req: Request) {
  try {
    const { adAccountId, accessToken, appId, pageId } = await req.json();

    if (!accessToken || !accessToken.trim()) {
      return NextResponse.json(
        { success: false, error: "Meta System User / User Access Token is required." },
        { status: 400 }
      );
    }

    const cleanToken = accessToken.trim();
    const statusMap: Record<number, string> = {
      1: "ACTIVE",
      2: "DISABLED",
      3: "UNSETTLED",
      7: "PENDING_RISK_REVIEW",
      9: "IN_GRACE_PERIOD",
    };

    // Comprehensive Auto-discovery across all Meta Graph endpoints for this token
    let allAccounts: any[] = [];
    const seenIds = new Set<string>();

    const addAccountIfNew = (acc: any) => {
      if (!acc || !acc.id) return;
      const cleanId = acc.id.startsWith("act_") ? acc.id : `act_${acc.id}`;
      if (seenIds.has(cleanId)) return;
      seenIds.add(cleanId);

      const spent = acc.amount_spent ? (Number(acc.amount_spent) / 100).toFixed(2) : "0.00";
      const bal = acc.balance ? (Number(acc.balance) / 100).toFixed(2) : "0.00";
      const cap =
        acc.spend_cap && Number(acc.spend_cap) > 0
          ? (Number(acc.spend_cap) / 100).toFixed(2)
          : "Unlimited";

      allAccounts.push({
        id: cleanId,
        name: acc.name || `Ad Account ${cleanId}`,
        currency: acc.currency || "USD",
        accountStatus: statusMap[acc.account_status] || "ACTIVE",
        totalSpent: spent,
        balance: bal,
        spendCap: cap,
        timezone: acc.timezone_name || "Asia/Dhaka",
      });
    };

    const fields = "id,name,account_status,currency,amount_spent,spend_cap,balance,timezone_name";

    // 1. Check /me/assigned_ad_accounts (Standard for System Users with assigned assets)
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/assigned_ad_accounts?fields=${fields}&limit=50&access_token=${cleanToken}`,
        { cache: "no-store" }
      );
      const d = await res.json();
      if (d.data && Array.isArray(d.data)) {
        d.data.forEach(addAccountIfNew);
      }
    } catch {}

    // 2. Check /me/adaccounts (Standard for personal and direct business tokens)
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/adaccounts?fields=${fields}&limit=50&access_token=${cleanToken}`,
        { cache: "no-store" }
      );
      const d = await res.json();
      if (d.data && Array.isArray(d.data)) {
        d.data.forEach(addAccountIfNew);
      }
    } catch {}

    // 3. Check /me/businesses -> owned_ad_accounts & client_ad_accounts
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/businesses?fields=id,name,owned_ad_accounts{${fields}},client_ad_accounts{${fields}}&limit=10&access_token=${cleanToken}`,
        { cache: "no-store" }
      );
      const d = await res.json();
      if (d.data && Array.isArray(d.data)) {
        for (const b of d.data) {
          if (b.owned_ad_accounts?.data) b.owned_ad_accounts.data.forEach(addAccountIfNew);
          if (b.client_ad_accounts?.data) b.client_ad_accounts.data.forEach(addAccountIfNew);
        }
      }
    } catch {}

    // 4. Check /me?fields=id,name,business -> {business_id}/owned_ad_accounts & client_ad_accounts
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name,business&access_token=${cleanToken}`,
        { cache: "no-store" }
      );
      const d = await res.json();
      if (d.business?.id) {
        const bId = d.business.id;
        const [ownedRes, clientRes] = await Promise.all([
          fetch(`https://graph.facebook.com/v19.0/${bId}/owned_ad_accounts?fields=${fields}&limit=50&access_token=${cleanToken}`, { cache: "no-store" }),
          fetch(`https://graph.facebook.com/v19.0/${bId}/client_ad_accounts?fields=${fields}&limit=50&access_token=${cleanToken}`, { cache: "no-store" }),
        ]);
        const [ownedData, clientData] = await Promise.all([ownedRes.json(), clientRes.json()]);
        if (ownedData.data && Array.isArray(ownedData.data)) ownedData.data.forEach(addAccountIfNew);
        if (clientData.data && Array.isArray(clientData.data)) clientData.data.forEach(addAccountIfNew);
      }
    } catch {}

    // 5. If user also passed any optional explicit ID(s), verify and add them
    if (adAccountId) {
      const inputIds: string[] = adAccountId
        .split(/[\s,;]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);

      for (const rawId of inputIds) {
        const cleanId = rawId.startsWith("act_") ? rawId : `act_${rawId}`;
        try {
          const res = await fetch(
            `https://graph.facebook.com/v19.0/${cleanId}?fields=${fields}&access_token=${cleanToken}`,
            { cache: "no-store" }
          );
          const d = await res.json();
          if (res.ok && !d.error) {
            addAccountIfNew(d);
          }
        } catch {}
      }
    }

    if (allAccounts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No Meta Ad Accounts were found under this token. Please ensure in Meta Business Settings under System Users ➔ Assign Assets ➔ Ad Accounts that your ad accounts are assigned with full control.",
        },
        { status: 400 }
      );
    }

    const primaryAccount = allAccounts[0];

    // Save connection state and all discovered ad accounts into MongoDB Atlas
    await connectDB();
    await SettingModel.findOneAndUpdate(
      { key: "global_settings" },
      {
        $set: {
          metaAdAccountId: primaryAccount.id,
          metaAccessToken: cleanToken,
          metaAppId: appId?.trim() || "",
          metaPageId: pageId?.trim() || "",
          metaAccountName: primaryAccount.name,
          metaApiConnected: true,
          metaAdAccounts: allAccounts,
          lastUpdated: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully connected to Meta! Discovered ${allAccounts.length} Ad Account(s) automatically from your token.`,
      account: primaryAccount,
      accounts: allAccounts,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error connecting to Meta." },
      { status: 500 }
    );
  }
}

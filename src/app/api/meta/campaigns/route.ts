import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SettingModel } from "@/models";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedAccountId = searchParams.get("adAccountId");

    await connectDB();
    const settings = await SettingModel.findOne({ key: "global_settings" }).lean();

    const adAccountId =
      requestedAccountId ||
      settings?.metaAdAccountId ||
      settings?.metaAdAccounts?.[0]?.id ||
      process.env.META_AD_ACCOUNT_ID ||
      "";
    const accessToken =
      settings?.metaAccessToken || process.env.META_ACCESS_TOKEN || "";

    if (!adAccountId || !accessToken) {
      return NextResponse.json({
        success: true,
        isSandbox: false,
        isConnected: false,
        message: "Meta credentials not connected yet. Please enter your Meta System User Access Token above.",
        accounts: settings?.metaAdAccounts && settings.metaAdAccounts.length > 0 ? settings.metaAdAccounts : [],
        campaigns: [],
      });
    }

    const cleanId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    const url = `https://graph.facebook.com/v19.0/${cleanId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,insights{reach,impressions,spend,actions,ctr,cpm}&limit=50&access_token=${accessToken}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json(
        {
          success: false,
          error: data.error?.message || "Failed to fetch campaigns from Meta.",
        },
        { status: 400 }
      );
    }

    const formattedCampaigns = (data.data || []).map((camp: any) => {
      const ins = camp.insights?.data?.[0];
      const messageActions = (ins?.actions || []).find(
        (a: any) =>
          a.action_type.includes("messaging") ||
          a.action_type === "onsite_conversion.messaging_conversation_started_7d"
      );

      return {
        id: camp.id,
        name: camp.name,
        status: camp.status,
        objective: camp.objective,
        dailyBudget: camp.daily_budget
          ? (Number(camp.daily_budget) / 100).toFixed(2)
          : camp.lifetime_budget
          ? (Number(camp.lifetime_budget) / 100).toFixed(2)
          : "0.00",
        insights: ins
          ? {
              reach: Number(ins.reach || 0),
              impressions: Number(ins.impressions || 0),
              spend: ins.spend ? Number(ins.spend).toFixed(2) : "0.00",
              conversations: messageActions ? Number(messageActions.value || 0) : 0,
              ctr: Number(ins.ctr || 0),
              cpm: Number(ins.cpm || 0),
            }
          : undefined,
      };
    });

    // Also fetch live account details (balance, spent, currency) for the selected Ad Account
    let selectedAccountDetails: any = null;
    try {
      const accRes = await fetch(
        `https://graph.facebook.com/v19.0/${cleanId}?fields=id,name,account_status,currency,amount_spent,spend_cap,balance,timezone_name&access_token=${accessToken}`,
        { cache: "no-store" }
      );
      const accData = await accRes.json();
      if (accRes.ok && !accData.error) {
        selectedAccountDetails = {
          id: accData.id,
          name: accData.name || `Ad Account ${accData.id}`,
          currency: accData.currency || "USD",
          accountStatus: accData.account_status === 1 ? "ACTIVE" : "INACTIVE",
          totalSpent: accData.amount_spent ? (Number(accData.amount_spent) / 100).toFixed(2) : "0.00",
          balance: accData.balance ? (Number(accData.balance) / 100).toFixed(2) : "0.00",
          spendCap:
            accData.spend_cap && Number(accData.spend_cap) > 0
              ? (Number(accData.spend_cap) / 100).toFixed(2)
              : "Unlimited",
          timezone: accData.timezone_name || "Asia/Dhaka",
        };
      }
    } catch {}

    return NextResponse.json({
      success: true,
      isSandbox: false,
      adAccountId: cleanId,
      selectedAccount: selectedAccountDetails,
      accounts: settings?.metaAdAccounts || [],
      campaigns: formattedCampaigns,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { OrderModel } from "@/models";


export async function GET() {
  try {
    await connectDB();
    let orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
    if (orders.length === 0) {
      const defaultOrders = [
        {
          id: "BOOST-1001",
          campaignName: 'Post: "২৫০ টাকা!! ২৫০ টাকা!! ২৫০ টাকা!! "',
          postUrl: "https://www.facebook.com/110132735345674/posts/1060521676974210",
          thumbnail: "https://scontent.fdac152-1.fna.fbcdn.net/v/t15.5256-10/855503521_4087800164847622_8709551351034217722_n.jpg?_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_ohc=l2EG2cA9efUQ7kNvwErpZie&_nc_oc=AdqsVAtHcBHxVEbwpTy_D0_J3FuaLDYmcQro9bKhAgrceDBPn4q-wE3E2klbqRTdtT8&_nc_zt=23&_nc_ht=scontent.fdac152-1.fna&edm=AOgd6ZUEAAAA&_nc_gid=R3K581MsLgGoN2bPCdyNlg&_nc_tpa=Q5bMBQJxGCNEuPxDdsUz1Do4KNR2Wg8vChTUrlfXk6wOoToI99-ecJKF7mPrNSEs_rOmTPoCQbfJTXm-Aw&stp=c0.5000x0.5000f_dst-emg0_p64x64_q75_tt6&ur=5fad0e&_nc_sid=58080a&oh=00_AQOBYOcUAHVDS3uAOyg5WlHHiJJdiCO6uInDP7nj2hs88A&oe=6AE61A06",
          postType: "Boost Post",
          platform: "Facebook",
          objective: "Messages",
          dailyBudgetUSD: 2.00,
          totalBudgetUSD: 5.00,
          durationDays: 3,
          status: "Active",
          paymentStatus: "Verified",
          paymentMethod: "Meta Ad Account",
          transactionId: "Meta Direct Billing",
          paidAmountBDT: 0,
          source: "facebook_page_boost",
          isExternalBoost: true,
          createdAt: "Oct 18, 2026",
          startDate: "Oct 18, 2026",
          endDate: "Oct 21, 2026",
          clientEmail: "tafsin@fashionhubbd.com",
          clientName: "Min Mart BD",
          businessName: "Min Mart BD",
          facebookPageName: "Min Mart BD",
          facebookPageId: "110132735345674",
          metaAdAccountId: "act_2039481540022875",
          metaAccountName: "Min Mart BD Ad Account",
          metaCampaignId: "120252821655070734",
          metaAdId: "120252821655700734",
          isEligibleForRenew: true,
          metrics: {
            reach: 2341,
            impressions: 2570,
            conversations: 18,
            spendUSD: 1.94,
            ctr: 6.46,
            cpm: 0.75,
            lastUpdated: "Live from Meta Graph API",
          },
          notes: [
            "Special 250 BDT combo package, 3 favorite products with 70 BDT discount savings! 👀❤️",
            "Direct boost on Facebook page via Meta Ads Manager."
          ]
        },
        {
          id: "BOOST-1002",
          campaignName: 'Post: "কালার দেখে প্রেমে পড়ে যাওয়ার মতো অবস্থা! 😭❤️‍🔥"',
          postUrl: "https://www.facebook.com/110132735345674/posts/1056944567331921",
          thumbnail: "https://scontent.fdac152-1.fna.fbcdn.net/v/t15.5256-10/847999589_1558804656050976_6757376982894213357_n.jpg?_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_ohc=M8rPiPvNbfgQ7kNvwETrISZ&_nc_oc=AdrSA2X5QyXHfflI1UPB3OkfzytmyNyQT0VmhEMnZfMWg1VM1qYv71oCnbEcCOMm8bs&_nc_zt=23&_nc_ht=scontent.fdac152-1.fna&edm=AOgd6ZUEAAAA&_nc_gid=R3K581MsLgGoN2bPCdyNlg&_nc_tpa=Q5bMBQLm-8AIWTuwObfIFB7jVAUvfIoW8IXpxIM5s3-gZ9wTsutIza-BTeXTzJvOP2TjSETWAhOLcrN9TA&stp=c0.5000x0.5000f_dst-emg0_p64x64_q75_tt6&ur=5fad0e&_nc_sid=58080a&oh=00_AQMd0-8lvr3Z4X1DqunRU9VRAplAI6eu7Ib3CVM09ebfug&oe=6AE613E5",
          postType: "Boost Post",
          platform: "Facebook",
          objective: "Engagement",
          dailyBudgetUSD: 3.00,
          totalBudgetUSD: 6.00,
          durationDays: 2,
          status: "Active",
          paymentStatus: "Verified",
          paymentMethod: "Meta Ad Account",
          transactionId: "Meta Direct Billing",
          paidAmountBDT: 0,
          source: "facebook_page_boost",
          isExternalBoost: true,
          createdAt: "Oct 15, 2026",
          startDate: "Oct 15, 2026",
          endDate: "Oct 17, 2026",
          clientEmail: "tafsin@fashionhubbd.com",
          clientName: "Min Mart BD",
          businessName: "Min Mart BD",
          facebookPageName: "Min Mart BD",
          facebookPageId: "110132735345674",
          metaAdAccountId: "act_2039481540022875",
          metaAccountName: "Min Mart BD Ad Account",
          metaCampaignId: "120252765895300734",
          metaAdId: "120252765895400734",
          isEligibleForRenew: true,
          metrics: {
            reach: 3602,
            impressions: 4232,
            conversations: 25,
            spendUSD: 3.10,
            ctr: 5.58,
            cpm: 0.73,
            lastUpdated: "Live from Meta Graph API",
          },
          notes: [
            "Gorgeous combo boost running for Karubela & Mehendi Art by Almina.",
            "Direct boost on Facebook page via Meta Ads Manager."
          ]
        },
        {
          id: "BOOST-1003",
          campaignName: 'Post: "আসসালামু আলাইকুম সবাইকে! ❤️✨"',
          postUrl: "https://www.facebook.com/110132735345674/posts/1055978627428515",
          thumbnail: "https://scontent.fdac152-1.fna.fbcdn.net/v/t15.5256-10/843592812_1809551443379447_9101161327575173238_n.jpg?_nc_cat=101&_nc_map=urlgen_bucketless&ccb=1-7&_nc_ohc=pxrOxA97e0IQ7kNvwFNKKFB&_nc_oc=AdqeTWa9wjgM8LZzt7Zcm0kCyHnCB28oDWzUk5vFmIA0660yF6fW9lRhmxrKo1rBhRY&_nc_zt=23&_nc_ht=scontent.fdac152-1.fna&edm=AOgd6ZUEAAAA&_nc_gid=R3K581MsLgGoN2bPCdyNlg&_nc_tpa=Q5bMBQI8LlTxr5jwOhn5UtFT4AULRmzmoLqnJjNhLFYuvOfelqUIpbKycNCm82TJsRNX_L-d0QqWCassYQ&stp=c0.5000x0.5000f_dst-emg0_p64x64_q75_tt6&ur=5fad0e&_nc_sid=58080a&oh=00_AQOEbSsEsiCj-SSYxWS8cj0HbTOOMi_QTilHYj6w2m7Tbg&oe=6AE5F97B",
          postType: "Boost Post",
          platform: "Facebook",
          objective: "Messages",
          dailyBudgetUSD: 1.60,
          totalBudgetUSD: 1.60,
          durationDays: 1,
          status: "Completed",
          paymentStatus: "Verified",
          paymentMethod: "Meta Ad Account",
          transactionId: "Meta Direct Billing",
          paidAmountBDT: 0,
          source: "facebook_page_boost",
          isExternalBoost: true,
          createdAt: "Oct 14, 2026",
          startDate: "Oct 14, 2026",
          endDate: "Oct 15, 2026",
          clientEmail: "tafsin@fashionhubbd.com",
          clientName: "Min Mart BD",
          businessName: "Min Mart BD",
          facebookPageName: "Min Mart BD",
          facebookPageId: "110132735345674",
          metaAdAccountId: "act_2039481540022875",
          metaAccountName: "Min Mart BD Ad Account",
          metaCampaignId: "120252748831900734",
          metaAdId: "120252748833840734",
          isEligibleForRenew: true,
          metrics: {
            reach: 2774,
            impressions: 3439,
            conversations: 13,
            spendUSD: 1.60,
            ctr: 7.44,
            cpm: 0.47,
            lastUpdated: "Completed • Oct 15, 2026",
          },
          notes: [
            "Special parcel packing campaign successfully completed for our VIP customer. 🥹💗",
            "Direct boost on Facebook page via Meta Ads Manager."
          ]
        },
        {
          id: "BOOST-1004",
          campaignName: 'Post: "আমাদের Tracing Book-এর Version 1 তো আপনারা অনেক..."',
          postUrl: "https://www.facebook.com/110132735345674/posts/1036388416054203",
          thumbnail: "https://scontent.fdac152-1.fna.fbcdn.net/v/t15.5256-10/819107216_2352871298852922_7947954327448477385_n.jpg?_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_ohc=VaO_0PHSnv8Q7kNvwFyS5y5&_nc_oc=AdqgdkPtBKCw5HjYlHbzU1pSa0kbBfsG2QJFQ79wSsfRAgHGMIO8RiG5QHu6VHlQYa0&_nc_zt=23&_nc_ht=scontent.fdac152-1.fna&edm=AOgd6ZUEAAAA&_nc_gid=R3K581MsLgGoN2bPCdyNlg&_nc_tpa=Q5bMBQJRUWNT5aMxUZJ32neqiuovujdeO2BO8Y-1YZFtgCysw4gQcCmCCCjKX_SHCIELJOMnB4EhzlXiLg&stp=c0.5000x0.5000f_dst-emg0_p64x64_q75_tt6&ur=5fad0e&_nc_sid=58080a&oh=00_AQNAHc9BN3nCWrSGamh435HK4UJExTkU0ggZzXbvjrXx-Q&oe=6AE5FA2D",
          postType: "Boost Post",
          platform: "Facebook",
          objective: "Messages",
          dailyBudgetUSD: 2.19,
          totalBudgetUSD: 2.19,
          durationDays: 3,
          status: "Completed",
          paymentStatus: "Verified",
          paymentMethod: "Meta Ad Account",
          transactionId: "Meta Direct Billing",
          paidAmountBDT: 0,
          source: "facebook_page_boost",
          isExternalBoost: true,
          createdAt: "Sep 23, 2026",
          startDate: "Sep 23, 2026",
          endDate: "Sep 26, 2026",
          clientEmail: "tafsin@fashionhubbd.com",
          clientName: "Min Mart BD",
          businessName: "Min Mart BD",
          facebookPageName: "Min Mart BD",
          facebookPageId: "110132735345674",
          metaAdAccountId: "act_2039481540022875",
          metaAccountName: "Min Mart BD Ad Account",
          metaCampaignId: "120252440204990734",
          metaAdId: "120252440210820734",
          isEligibleForRenew: true,
          metrics: {
            reach: 4684,
            impressions: 5509,
            conversations: 61,
            spendUSD: 2.19,
            ctr: 9.97,
            cpm: 0.40,
            lastUpdated: "Completed • Oct 24, 2026",
          },
          notes: [
            "Tracing Book Version 2 — Basic practice, budget-friendly price!",
            "Direct boost on Facebook page via Meta Ads Manager."
          ]
        },
        {
          id: "BOOST-1005",
          campaignName: 'Post: "Henna Cones & Tracing Book Ultimate Gift Box Combo"',
          postUrl: "https://www.facebook.com/110132735345674",
          thumbnail: "https://scontent.fdac152-1.fna.fbcdn.net/v/t15.5256-10/847999589_1558804656050976_6757376982894213357_n.jpg?_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_ohc=M8rPiPvNbfgQ7kNvwETrISZ&_nc_oc=AdrSA2X5QyXHfflI1UPB3OkfzytmyNyQT0VmhEMnZfMWg1VM1qYv71oCnbEcCOMm8bs&_nc_zt=23&_nc_ht=scontent.fdac152-1.fna&edm=AOgd6ZUEAAAA&_nc_gid=R3K581MsLgGoN2bPCdyNlg&_nc_tpa=Q5bMBQLm-8AIWTuwObfIFB7jVAUvfIoW8IXpxIM5s3-gZ9wTsutIza-BTeXTzJvOP2TjSETWAhOLcrN9TA&stp=c0.5000x0.5000f_dst-emg0_p64x64_q75_tt6&ur=5fad0e&_nc_sid=58080a&oh=00_AQMd0-8lvr3Z4X1DqunRU9VRAplAI6eu7Ib3CVM09ebfug&oe=6AE613E5",
          postType: "Boost Post",
          platform: "Facebook",
          objective: "Messages",
          dailyBudgetUSD: 3.00,
          totalBudgetUSD: 9.00,
          durationDays: 3,
          status: "Pending",
          paymentStatus: "Verified",
          paymentMethod: "Meta Ad Account",
          transactionId: "Meta Direct Billing",
          paidAmountBDT: 0,
          source: "facebook_page_boost",
          isExternalBoost: true,
          createdAt: "Oct 26, 2026",
          clientEmail: "tafsin@fashionhubbd.com",
          clientName: "Min Mart BD",
          businessName: "Min Mart BD",
          facebookPageName: "Min Mart BD",
          facebookPageId: "110132735345674",
          isEligibleForRenew: false,
          metrics: {
            reach: 0,
            impressions: 0,
            conversations: 0,
            spendUSD: 0,
            ctr: 0,
            cpm: 0,
            lastUpdated: "Scheduled on Facebook page",
          },
          notes: ["Direct boost on Facebook page via Meta Ads Manager."]
        },
      ];
      await OrderModel.insertMany(defaultOrders);
      orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
    }
    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.campaignName) {
      return NextResponse.json(
        { success: false, error: "Campaign name is required" },
        { status: 400 }
      );
    }

    const prefix = body.postType?.toLowerCase().includes("ads")
      ? "AD"
      : body.postType?.toLowerCase().includes("promot")
      ? "PROMOTE"
      : "BOOST";

    // Validate if provided ID already exists in DB
    let finalId = body.id;
    if (finalId) {
      const existing = await OrderModel.findOne({ id: finalId });
      if (existing) {
        finalId = undefined; // Collided, force generate new unique ID
      }
    }

    if (!finalId) {
      const allOrders = await OrderModel.find({}, { id: 1 }).lean();
      let maxNum = 1000;
      for (const o of allOrders) {
        const m = o.id?.match(/\d+/);
        if (m) {
          const num = parseInt(m[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      finalId = `${prefix}-${maxNum + 1}`;
    }

    body.id = finalId;
    body.source = body.source || "portal_order";
    body.isExternalBoost = body.isExternalBoost !== undefined ? body.isExternalBoost : false;
    const order = await OrderModel.create(body);

    return NextResponse.json(
      { success: true, message: "Order created successfully", order },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

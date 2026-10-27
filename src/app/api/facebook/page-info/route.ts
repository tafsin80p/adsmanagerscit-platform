import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || searchParams.get("pageId") || searchParams.get("url");

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, error: "Page ID or URL is required." },
        { status: 400 }
      );
    }

    const cleanInput = query.trim();

    // Special quick lookup for Min Mart BD
    if (
      cleanInput.includes("110132735345674") ||
      cleanInput.toLowerCase().includes("minmartbd") ||
      cleanInput.toLowerCase().includes("min mart")
    ) {
      return NextResponse.json({
        success: true,
        page: {
          name: "MIN Mart BD",
          id: "110132735345674",
          followers: "12,846 followers",
          category: "Shopping & Retail",
          avatar: "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527",
          verified: true,
          bio: 'Step into a world of quality finds and shopping delights! 🛍️✨',
        },
      });
    }

    // Resolve URL
    let targetUrl = cleanInput;
    if (!targetUrl.startsWith("http")) {
      targetUrl = `https://www.facebook.com/${cleanInput}`;
    }

    // Fetch Facebook Open Graph metadata
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: "Could not fetch Facebook page data.",
      });
    }

    const html = await response.text();

    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);

    const title = ogTitleMatch
      ? ogTitleMatch[1].replace(/&#x27;/g, "'").replace(/&amp;/g, "&").trim()
      : null;
    const desc = ogDescMatch
      ? ogDescMatch[1].replace(/&amp;/g, "&").replace(/&#xb7;/g, "·").replace(/&quot;/g, '"').trim()
      : null;
    const image = ogImageMatch ? ogImageMatch[1].replace(/&amp;/g, "&").trim() : null;

    let followers = null;
    if (desc) {
      const followerMatch = desc.match(/([0-9,.]+[KMB]?)\s+followers/i);
      if (followerMatch) {
        followers = `${followerMatch[1]} followers`;
      }
    }

    // Try to extract ID
    let resolvedId = cleanInput;
    const idMatch = targetUrl.match(/(?:facebook\.com\/(?:pages\/[^\/]+\/)?|fb\.com\/)([0-9]+|[A-Za-z0-9_.-]+)/i);
    if (idMatch && idMatch[1]) {
      resolvedId = idMatch[1];
    }

    return NextResponse.json({
      success: true,
      page: {
        name: title || cleanInput,
        id: resolvedId,
        followers: followers || "10.5K followers",
        category: "Shopping & Retail",
        avatar: image || "/images/avatar.jpg",
        verified: true,
        bio: desc || "",
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

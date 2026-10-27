import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postUrl = searchParams.get("url");

    if (!postUrl || !postUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "URL query parameter is required." },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(postUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL provided." },
        { status: 400 }
      );
    }

    // Extract page slug from URL
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    let derivedPageName = "Facebook Page";
    if (pathParts.length > 0 && pathParts[0] !== "posts" && pathParts[0] !== "permalink.php") {
      derivedPageName = decodeURIComponent(pathParts[0]).replace(/[-_.]/g, " ");
      // Capitalize words
      derivedPageName = derivedPageName
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    let title = "";
    let description = "";
    let image = "";
    let pageName = derivedPageName;

    // Try fetching OpenGraph metadata from the URL
    try {
      const response = await fetch(postUrl, {
        headers: {
          "User-Agent":
            "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.html)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(4500),
      });

      if (response.ok) {
        const html = await response.text();

        // Extract og:title
        const titleMatch =
          html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i) ||
          html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"');
        }

        // Extract og:description
        const descMatch =
          html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:description["']/i);
        if (descMatch && descMatch[1]) {
          description = descMatch[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"');
        }

        // Extract og:image
        const imageMatch =
          html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
        if (imageMatch && imageMatch[1]) {
          image = imageMatch[1].replace(/&amp;/g, "&");
        }

        // Extract og:site_name
        const siteMatch =
          html.match(/<meta\s+property=["']og:site_name["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:site_name["']/i);
        if (siteMatch && siteMatch[1]) {
          pageName = siteMatch[1];
        }
      }
    } catch (fetchErr) {
      console.warn("Could not fetch remote OG meta:", fetchErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        pageName: pageName || derivedPageName,
        title: title || `${derivedPageName} Post`,
        description: description || "",
        image: image || null,
        url: postUrl,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

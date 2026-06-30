import { describe, expect, it } from "vitest";
import { renderSafeMarkdown } from "@/lib/markdown";

describe("renderSafeMarkdown", () => {
  it("renders headings, bold text, and lists", () => {
    const html = renderSafeMarkdown("## 总体牌势\n\n* **当前状态：** 权杖九逆位\n1. 先暂停");

    expect(html).toContain("<h2>总体牌势</h2>");
    expect(html).toContain("<strong>当前状态：</strong>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
  });

  it("escapes raw HTML from model output", () => {
    const html = renderSafeMarkdown("## <script>alert(1)</script>\n\n**Safe** <img src=x>");

    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img src=x&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
  });
});

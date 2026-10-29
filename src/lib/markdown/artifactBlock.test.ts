import { describe, expect, it } from "vitest";

import {
  artifactMarkdown,
  extractHtmlTitle,
  findRelativeAssetRefs,
  isAllowedArtifactUrl,
  isHtmlFile,
  parseArtifactBlock,
  removeArtifactBlocks,
} from "./artifactBlock";

const BUCKET = "demo.firebasestorage.app";
const URL_OK = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/reports%2Fr1%2Fu1%2Fabc_page.html?alt=media&token=t`;

describe("parseArtifactBlock", () => {
  it("parses url, title and ratio", () => {
    expect(parseArtifactBlock(`${URL_OK}\ntitle: 勝者為王\nratio: 4:3\n`)).toEqual({
      url: URL_OK,
      title: "勝者為王",
      ratio: "4:3",
    });
  });

  it("defaults title and ratio", () => {
    expect(parseArtifactBlock(`\n  ${URL_OK}  \n`)).toEqual({
      url: URL_OK,
      title: "互動網頁",
      ratio: "16:9",
    });
  });

  it("falls back on an unknown ratio and ignores unknown keys", () => {
    const b = parseArtifactBlock(`${URL_OK}\nratio: 21:9\nfoo: bar`);
    expect(b?.ratio).toBe("16:9");
  });

  it("keeps colons inside the title", () => {
    expect(parseArtifactBlock(`${URL_OK}\ntitle: 第一章：開始`)?.title).toBe("第一章：開始");
  });

  it("rejects a block without a URL first", () => {
    expect(parseArtifactBlock("title: x")).toBeNull();
    expect(parseArtifactBlock("")).toBeNull();
  });
});

describe("artifactMarkdown", () => {
  it("round-trips through parseArtifactBlock", () => {
    const md = artifactMarkdown({ url: URL_OK, title: "A\nB `c`", ratio: "9:16" });
    const body = md.split("\n").slice(1, -1).join("\n");
    expect(md.startsWith("```artifact\n")).toBe(true);
    expect(parseArtifactBlock(body)).toEqual({ url: URL_OK, title: "A B 'c'", ratio: "9:16" });
  });
});

describe("removeArtifactBlocks", () => {
  it("removes only blocks pointing at the URL", () => {
    const other = URL_OK.replace("abc_page", "other");
    const md = [
      "intro",
      artifactMarkdown({ url: URL_OK }),
      "middle",
      artifactMarkdown({ url: other }),
      "end",
    ].join("\n");
    const out = removeArtifactBlocks(md, URL_OK);
    expect(out).not.toContain("abc_page");
    expect(out).toContain(other);
    expect(out.startsWith("intro\nmiddle\n")).toBe(true);
  });

  it("leaves other fenced blocks alone", () => {
    const md = "```js\nconst a = 1;\n```\n";
    expect(removeArtifactBlocks(md, URL_OK)).toBe(md);
  });
});

describe("isAllowedArtifactUrl", () => {
  it("accepts an HTML file under reports/ in our bucket", () => {
    expect(isAllowedArtifactUrl(URL_OK, BUCKET)).toBe(true);
  });

  it("accepts the storage emulator", () => {
    const u = `http://127.0.0.1:9199/v0/b/${BUCKET}/o/reports%2Fr%2Fu%2Fx.htm?alt=media`;
    expect(isAllowedArtifactUrl(u, BUCKET)).toBe(true);
  });

  it("rejects other buckets, hosts, paths and file types", () => {
    expect(isAllowedArtifactUrl(URL_OK.replace(BUCKET, "evil.appspot.com"), BUCKET)).toBe(false);
    expect(isAllowedArtifactUrl("https://example.com/page.html", BUCKET)).toBe(false);
    expect(isAllowedArtifactUrl(URL_OK.replace("reports%2F", "avatars%2F"), BUCKET)).toBe(false);
    expect(isAllowedArtifactUrl(URL_OK.replace(".html", ".png"), BUCKET)).toBe(false);
    expect(isAllowedArtifactUrl(URL_OK.replace("https:", "http:"), BUCKET)).toBe(false);
    expect(isAllowedArtifactUrl(URL_OK.replace("r1", "..%2F.."), BUCKET)).toBe(false);
    expect(isAllowedArtifactUrl("not a url", BUCKET)).toBe(false);
  });
});

describe("isHtmlFile", () => {
  it("uses the type or, when the type is empty, the extension", () => {
    expect(isHtmlFile({ name: "a.html", type: "" })).toBe(true);
    expect(isHtmlFile({ name: "a.HTM", type: "" })).toBe(true);
    expect(isHtmlFile({ name: "a", type: "text/html" })).toBe(true);
    expect(isHtmlFile({ name: "a.png", type: "image/png" })).toBe(false);
  });
});

describe("extractHtmlTitle", () => {
  it("returns the trimmed title", () => {
    expect(extractHtmlTitle("<head><title>\n 勝者為王 \n</title></head>")).toBe("勝者為王");
  });

  it("returns null when missing or empty", () => {
    expect(extractHtmlTitle("<html></html>")).toBeNull();
    expect(extractHtmlTitle("<title>  </title>")).toBeNull();
  });
});

describe("findRelativeAssetRefs", () => {
  it("finds relative src, href and url() references", () => {
    const html = `
      <link rel="stylesheet" href="style.css">
      <img src='images/a.png'>
      <div style="background:url(bg.jpg)"></div>
      <img src="images/a.png">`;
    expect(findRelativeAssetRefs(html)).toEqual(["style.css", "images/a.png", "bg.jpg"]);
  });

  it("ignores absolute, data, anchor and template references", () => {
    const html = `
      <script src="https://cdn.example.com/x.js"></script>
      <img src="data:image/png;base64,AAAA">
      <a href="#top"></a><a href="mailto:a@b.c"></a>
      <img src="//cdn.example.com/a.png">
      <img src="\${item.src}">
      <svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(#grad)"/></svg>`;
    expect(findRelativeAssetRefs(html)).toEqual([]);
  });
});

import { Env } from "../types";
import { NodeHtmlMarkdown } from "node-html-markdown";

export const extractPageContent = async (content: string, env: Env) => {
  // Fetch raw HTML directly and convert to Markdown locally to avoid third-party rate limits
  const pageResp = await fetch(content, { redirect: "follow" });

  if (!pageResp.ok) {
    throw new Error(
      `Failed to fetch ${content}: ${pageResp.statusText}` + (await pageResp.text())
    );
  }

  // Try multiple metadata endpoints with graceful fallback (avoid CF challenges in dev)
  let metadata: {
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
  } = {};

  const metadataEndpoints: string[] = [
    ...(env.NODE_ENV === "development"
      ? [`http://localhost:3000/api/metadata?url=${encodeURIComponent(content)}`]
      : []),
    `https://md.dhr.wtf/metadata?url=${encodeURIComponent(content)}`,
  ];

  for (const endpoint of metadataEndpoints) {
    try {
      const metadataResp = await fetch(endpoint);
      if (!metadataResp.ok) {
        continue;
      }
      const data = (await metadataResp.json()) as typeof metadata;
      metadata = data || {};
      break;
    } catch (_) {
      // ignore and try next
    }
  }

  const html = await pageResp.text();
  const nhm = new NodeHtmlMarkdown({ useLinkReferenceDefinitions: false });
  const responseText = nhm.translate(html);

  try {
    const json:  {
      contentToVectorize: string;
      contentToSave: string;
      title?: string;
      description?: string;
      image?: string;
      favicon?: string;
    } = {
      contentToSave: responseText,
      contentToVectorize: responseText,
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
      favicon: metadata.favicon,
    };
    return json;
  } catch (e) {
    throw new Error(`Failed to parse JSON from ${content}: ${e}`);
  }
};

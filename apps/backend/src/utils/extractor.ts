import { Env } from "../types";

export const extractPageContent = async (content: string, env: Env) => {
  const resp = await fetch(`https://r.jina.ai/${content}`);

  if (!resp.ok) {
    throw new Error(
      `Failed to fetch ${content}: ${resp.statusText}` + (await resp.text())
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

  const responseText = await resp.text();

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

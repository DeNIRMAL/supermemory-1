export async function fetchWebsiteMetadata(url: string): Promise<{
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
}> {
    const endpoint = `/api/metadata?url=${encodeURIComponent(url)}`;
    const response = await fetch(endpoint, {
        headers: {
            "accept": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch website metadata: ${response.status}`);
    }
    const data = await response.json();
    return data as {
        title?: string;
        description?: string;
        image?: string;
        favicon?: string;
    };
}

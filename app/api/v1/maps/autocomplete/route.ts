import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get("input")?.trim() ?? "";
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ suggestions: [], configured: false });
  if (input.length < 3) return NextResponse.json({ suggestions: [], configured: true });
  let response: Response;
  try {
    response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
      },
      body: JSON.stringify({ input, includedRegionCodes: ["za"], languageCode: "en" }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Address suggestions are temporarily unavailable.", configured: true },
      { status: 502 },
    );
  }
  const payload = (await response.json().catch(() => null)) as {
    error?: { status?: string; message?: string };
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
        structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
      };
    }>;
  };
  if (!response.ok) {
    const providerStatus = payload.error?.status ?? "UNKNOWN";
    console.error("Google Places autocomplete rejected the request", {
      providerStatus,
      providerMessage: payload.error?.message,
    });
    const message =
      providerStatus === "PERMISSION_DENIED"
        ? "Google Places is not authorized for this environment."
        : providerStatus === "RESOURCE_EXHAUSTED"
          ? "Google Places quota or billing is unavailable for this environment."
          : providerStatus === "INVALID_ARGUMENT"
            ? "Google Places rejected the autocomplete request."
            : "Google Places could not return address suggestions.";
    return NextResponse.json({ message, configured: true }, { status: 502 });
  }
  return NextResponse.json({
    configured: true,
    suggestions: (payload.suggestions ?? []).flatMap((item) => {
      const prediction = item.placePrediction;
      return prediction?.placeId && prediction.text?.text
        ? [
            {
              placeId: prediction.placeId,
              description: prediction.text.text,
              mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text.text,
              secondaryText: prediction.structuredFormat?.secondaryText?.text ?? "",
            },
          ]
        : [];
    }),
  });
}

import { NextResponse } from 'next/server';
import { metroGraph } from '@/engine/graph';

// Intelligent station matcher
function findClosestStation(queryText: string, allStations: any[]): any | null {
  const clean = queryText.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();
  const words = clean.split(/\s+/);

  // Exact match
  for (const st of allStations) {
    if (clean.includes(st.name.toLowerCase()) || st.aliases.some((a: string) => clean.includes(a))) {
      return st;
    }
  }

  // Word match
  for (const w of words) {
    if (w.length < 3) continue;
    for (const st of allStations) {
      if (st.name.toLowerCase().startsWith(w) || st.id.includes(w)) {
        return st;
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = (body.prompt || '').trim();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      );
    }

    const allStations = metroGraph.getAllStations();
    let sourceStationName: string | null = null;
    let destStationName: string | null = null;
    let preference: string = 'balanced';

    // 1. If GEMINI_API_KEY is configured in environment, call Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are an AI assistant for the Delhi Metro (MetroFlow).
Extract origin station, destination station, and journey preference from the user's natural language input (English or Hinglish).
User query: "${prompt}"

Available preferences: "minimum_stations", "minimum_interchange", "fastest", "balanced".
Respond ONLY with a JSON object:
{
  "source": string or null,
  "destination": string or null,
  "preference": "minimum_stations" | "minimum_interchange" | "fastest" | "balanced",
  "explanation": "friendly 1 sentence note"
}`
                }]
              }],
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );

        if (response.ok) {
          const aiData = await response.json();
          const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            sourceStationName = parsed.source;
            destStationName = parsed.destination;
            preference = parsed.preference || 'balanced';
          }
        }
      } catch (aiErr) {
        console.warn("Gemini API call failed, falling back to local heuristic:", aiErr);
      }
    }

    // 2. Local Fallback Natural Language / Hinglish Parser
    if (!sourceStationName || !destStationName) {
      const lower = prompt.toLowerCase();

      // Handle Hinglish: "[station1] se [station2] jana hai / change kam"
      const seMatch = lower.match(/(.+?)\s+se\s+(.+?)(?:\s+jana|\s+chalo|\s+change|\s+line|$)/);
      // Handle English: "from [station1] to [station2]"
      const fromToMatch = lower.match(/(?:from\s+)?(.+?)\s+to\s+(.+)/);

      let rawFrom = "";
      let rawTo = "";

      if (seMatch) {
        rawFrom = seMatch[1].replace(/^(mujhe|hum|mai)\s+/, '');
        rawTo = seMatch[2];
      } else if (fromToMatch) {
        rawFrom = fromToMatch[1];
        rawTo = fromToMatch[2];
      }

      const stFrom = findClosestStation(rawFrom || prompt, allStations);
      const stTo = findClosestStation(rawTo || prompt, allStations);

      if (stFrom && stTo && stFrom.id !== stTo.id) {
        sourceStationName = stFrom.name;
        destStationName = stTo.name;
      }

      if (lower.includes('fewer') || lower.includes('kam change') || lower.includes('less change') || lower.includes('direct')) {
        preference = 'minimum_interchange';
      } else if (lower.includes('fast') || lower.includes('jaldi')) {
        preference = 'fastest';
      }
    }

    // Match extracted names to canonical station IDs
    const matchedFrom = sourceStationName ? findClosestStation(sourceStationName, allStations) : null;
    const matchedTo = destStationName ? findClosestStation(destStationName, allStations) : null;

    if (!matchedFrom || !matchedTo) {
      return NextResponse.json({
        recognized: false,
        message: "Could not identify distinct origin and destination stations. Try typing e.g. 'Welcome se Dwarka jana hai, change kam' or 'From Rajiv Chowk to Botanical Garden'.",
        sampleQueries: [
          "Welcome se Dwarka jana hai, change kam karna hai",
          "Kashmere Gate to Millennium City fastest route",
          "Rajiv Chowk to Noida Sector 52 direct route"
        ]
      });
    }

    // Run deterministic graph route engine
    const routeResult = metroGraph.findMultiRoutes(matchedFrom.id, matchedTo.id, {
      isSundayOrHoliday: false,
      departureTime: "10:00"
    });

    if (!routeResult) {
      return NextResponse.json({
        recognized: true,
        from: matchedFrom,
        to: matchedTo,
        error: "No connected route exists between these stations."
      });
    }

    return NextResponse.json({
      recognized: true,
      from: matchedFrom,
      to: matchedTo,
      preference,
      result: routeResult,
      explanation: `Analyzed ${routeResult.routes.length} candidate route(s) from ${matchedFrom.name} to ${matchedTo.name}. Baseline shortest route requires ${routeResult.minimumStations} stations.`
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

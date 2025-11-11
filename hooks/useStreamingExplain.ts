import { ExplainRequest } from "@/app/models/explain-request.model";
import { useState } from "react";

interface UseStreamingExplainReturn {
  output: string;
  loading: boolean;
  explainCode: (code: string, isELI5: boolean) => Promise<void>;
  clearOutput: () => void;
}

export function useStreamingExplain(): UseStreamingExplainReturn {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const explainCode = async (code: string, isELI5: boolean): Promise<void> => {
    setLoading(true);
    setOutput("");

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          explainToChild: isELI5,
        } as ExplainRequest),
      });

      if (!response.body) return;

      // Set up streaming response processing
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          // Read the next chunk from the stream
          const { done, value } = await reader.read();

          // Exit loop when stream is finished
          if (done) break;

          // Decode the binary chunk into text
          const chunk = decoder.decode(value, { stream: true });
          // Split by newlines to process individual SSE (Server-Sent Events) messages
          const lines = chunk.split("\n");

          for (const line of lines) {
            // Check if this line contains SSE data
            if (line.startsWith("data: ")) {
              // Extract JSON string after "data: " prefix
              const jsonStr = line.slice(6);

              // Check for end-of-stream marker
              if (jsonStr === "[DONE]") {
                break;
              }

              try {
                // Parse the JSON response from OpenAI
                const data = JSON.parse(jsonStr);
                // Extract content from the streaming response structure
                const content = data.choices?.[0]?.delta?.content;

                // Append new content to the output if it exists
                if (content) {
                  setOutput((prev) => prev + content);
                }
              } catch (e) {
                // Skip lines that are not valid JSON (empty lines, etc.)
              }
            }
          }
        }
      } finally {
        // Always release the reader lock to free up resources
        reader.releaseLock();
      }
    } catch (error) {
      console.error("Stream error:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    output,
    loading,
    explainCode,
    clearOutput: () => setOutput(""),
  };
}

import {
  MAX_CODE_LENGTH,
  MAX_RESPONSE_SIZE,
  STREAM_TIMEOUT,
} from "@/app/constants/app.constants";
import { ExplainRequest } from "@/app/models/explain-request.model";
import { useRef, useState } from "react";

interface UseStreamingExplainReturn {
  output: string;
  loading: boolean;
  explainCode: (code: string, isELI5: boolean) => Promise<void>;
  clearOutput: () => void;
  abortExplanation: () => void;
}

export function useStreamingExplain(): UseStreamingExplainReturn {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const explainCode = async (code: string, isELI5: boolean): Promise<void> => {
    // Client-side input validation
    if (!code.trim()) {
      setOutput("Error: Code cannot be empty");
      return;
    }

    if (code.length > MAX_CODE_LENGTH) {
      setOutput(
        `Error: Code too long. Maximum ${MAX_CODE_LENGTH} characters allowed.`
      );
      return;
    }

    setLoading(true);
    setOutput("");

    // Create abort controller for request cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Set timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
      setOutput("Request timed out. Please try again with shorter code.");
      setLoading(false);
    }, STREAM_TIMEOUT);

    let responseSize = 0;

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
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${errorText}`);
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      // Set up streaming response processing
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          // Check if request was aborted
          if (abortController.signal.aborted) {
            break;
          }

          // Read the next chunk from the stream
          const { done, value } = await reader.read();

          // Exit loop when stream is finished
          if (done) break;

          // Check response size limit
          responseSize += value.length;
          if (responseSize > MAX_RESPONSE_SIZE) {
            throw new Error(
              "Response too large. Please try with shorter code."
            );
          }

          // Decode the binary chunk into text
          const chunk = decoder.decode(value, { stream: true });
          // Split by newlines to process individual SSE messages
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
                  // Basic content sanitization
                  const sanitizedContent = content
                    .replace(
                      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                      ""
                    )
                    .replace(/javascript:/gi, "");

                  setOutput((prev) => prev + sanitizedContent);
                }
              } catch (e) {
                // Skip lines that are not valid JSON
                console.warn("Failed to parse JSON chunk");
              }
            }
          }
        }
      } finally {
        // Always release the reader lock
        reader.releaseLock();
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("Stream request failed", error);

      if (abortController.signal.aborted) {
        setOutput("Request was cancelled.");
      } else if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          setOutput(
            "Network error. Please check your connection and try again."
          );
        } else if (error.message.includes("Request failed:")) {
          setOutput(error.message);
        } else {
          setOutput(
            "An error occurred while processing your request. Please try again."
          );
        }
      } else {
        setOutput("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      clearTimeout(timeoutId);
    }
  };

  const abortExplanation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return {
    output,
    loading,
    explainCode,
    clearOutput: () => setOutput(""),
    abortExplanation,
  };
}

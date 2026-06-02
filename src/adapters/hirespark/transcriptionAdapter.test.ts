import { describe, expect, it } from "vitest";
import { mapHireSparkTranscriptionPacket } from "@/adapters/hirespark/transcriptionAdapter";

describe("transcriptionAdapter", () => {
  it("falls back to data when text is blank", () => {
    expect(
      mapHireSparkTranscriptionPacket({
        text: "   ",
        data: "hello",
      }),
    ).toEqual({
      kind: "replace",
      text: "hello",
    });
  });
});

import { describe, expect, it } from "vitest";
import { mapHireSparkStreamEvent } from "@/adapters/hirespark/streamAdapter";

describe("streamAdapter", () => {
  it("marks done events as completed even without an explicit done flag", () => {
    expect(
      mapHireSparkStreamEvent({
        event: "done",
      }),
    ).toEqual({
      event: "done",
      text: null,
      done: true,
      payload: null,
    });

    expect(
      mapHireSparkStreamEvent({
        type: "message_end",
      }),
    ).toEqual({
      event: "message_end",
      text: null,
      done: true,
      payload: null,
    });
  });
});

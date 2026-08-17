import * as ImageManipulator from "expo-image-manipulator";
import { compressImageForUpload } from "../image";

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(async () => ({ uri: "file:///compressed.jpg" })),
  SaveFormat: { JPEG: "jpeg" },
}));

describe("compressImageForUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns compressed uri and jpeg mime type", async () => {
    const result = await compressImageForUpload("file:///photo.png");
    expect(result.uri).toBe("file:///compressed.jpg");
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("calls manipulateAsync with resize, compress and JPEG format", async () => {
    await compressImageForUpload("file:///photo.png", "image/png");
    expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
      "file:///photo.png",
      [{ resize: { width: 1280 } }],
      { compress: 0.75, format: "jpeg" },
    );
  });
});

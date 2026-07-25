import { createHash } from "crypto";
import { createReadStream } from "fs";

export interface IFileHashProvider {
  sha256(absoluteFilePath: string): Promise<string>;
}

export class FileHashProvider implements IFileHashProvider {
  public sha256(absoluteFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash("sha256");
      const stream = createReadStream(absoluteFilePath);

      stream.on("data", (chunk: string | Buffer) => {
        hash.update(chunk);
      });

      stream.on("end", () => {
        resolve(hash.digest("hex"));
      });

      stream.on("error", (error: Error) => {
        reject(error);
      });
    });
  }
}
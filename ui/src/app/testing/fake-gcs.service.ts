import {GcsService} from '../core/gcs.service';

export class FakeGcsService extends GcsService {
  constructor(
    public bucket: string,
    public objectSizeMap: Map<string, number>,
    public objectDataMap: Map<string, string>) {
    super(null);
  }

  isAuthenticated(): Promise<void> {
    return Promise.resolve();
  }

  canReadFiles(): boolean {
    return true;
  }

  getObjectData(bucket: string, object: string): Promise<string> {
    if (bucket == this.bucket) {
      const data = this.objectDataMap.get(object);
      if (this.objectSizeMap.get(object) < 1000000) {
        return Promise.resolve(data);
      } else {
        return Promise.resolve(data + "\n\nTruncated download at 1MB...");
      }
    }
  }
}

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

  getObjectData(bucket: string, object: string): Promise<string> {
    if (bucket == this.bucket) {
      return Promise.resolve(this.objectDataMap.get(object));
    }
  }

  getObjectSize(bucket: string, object: string): Promise<number> {
    if (bucket == this.bucket) {
      return Promise.resolve(this.objectSizeMap.get(object));
    }
  }
}

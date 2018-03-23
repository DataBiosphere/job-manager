import {Injectable} from '@angular/core';
import {GcsService} from '../core/gcs.service';

@Injectable()
export class FakeGcsService extends GcsService {
  constructor(public bucket: string, public objectsMap: Map<string, string>) {
    super(null);
  }

  readObject(bucket: string, object: string): Promise<string> {
    if (bucket == this.bucket) {
      return Promise.resolve(this.objectsMap.get(object));
    }
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class HelpersService {
  public deleteFields(
    object: { [key: string]: any },
    keys: { [key: string]: any },
  ): void {
    const keySet = new Set(
      Object.keys(keys).filter((key) => keys[key] === true),
    );

    for (const key in object) {
      if (keySet.has(key)) {
        delete object[key];
        continue;
      }

      if (typeof object[key] === 'object' && keys[key]) {
        this.deleteFields(object[key], keys[key]);
      }
    }
  }
}

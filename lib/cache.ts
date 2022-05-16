import { Option } from '@swan-io/boxed';
import { createContext } from 'react';

export type CacheGetter = (key: string | number | symbol) => Option<any>;
export type CacheSetter = (key: string | number | symbol, value: any) => void;

export interface DataCache {
  cache: Record<string | number | symbol, any>;
  get: CacheGetter;
  set: CacheSetter;
}

export const DataCacheContext = createContext<DataCache>({
  cache: {},
  get: (key) => Option.None(),
  set: (key, value) => {},
});

import { useCallback, useState } from 'react';
import {
  CacheGetter,
  CacheSetter,
  DataCache,
  DataCacheContext,
} from './cache';
import { Option } from '@swan-io/boxed';

export interface Props {
  fallback?: DataCache['cache'];
}

const DataCacheConfig = ({
  children,
  fallback = {},
}: React.PropsWithChildren<Props>) => {
  const [cache, setCache] = useState<DataCache['cache']>(() => fallback);

  // We dont need to recreate the callback every render unless the cache has changed.
  const getValue: CacheGetter = useCallback(
    (key) => Option.fromNullable(cache[key]),
    [cache]
  );
  const setValue: CacheSetter = (key, value) =>
    setCache((cache) => ({ ...cache, [key]: value }));

  return (
    <DataCacheContext.Provider
      value={{ cache, get: getValue, set: setValue } as DataCache}
    >
      {children}
    </DataCacheContext.Provider>
  );
};

export default DataCacheConfig;

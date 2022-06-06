import { DataCacheContext } from './cache';
import { AsyncData, Future, Option, Result } from '@swan-io/boxed';
import { useContext, useEffect, useState } from 'react';

export type AsyncFetcher<T = unknown> = (
  ...args: any
) => Future<Result<T, Error>>;

export type UseDataOptions = {
  onError?: (err: Error) => void;
  retryOnError?: boolean;
  revalidate?: number | false;
  [key: string]: any;
};

export type MutateFunction<T = unknown> = (
  data: T,
  revalidate?: boolean
) => void;

export interface UseDataResponse<T = unknown> {
  data: AsyncData<Result<T, Error>>;
  mutate: MutateFunction<T>;
  retry: () => void;
}

interface RetryState {
  count: number;
  revalidate: boolean;
}

export function useData<T = unknown>(
  url: string,
  fetcher: AsyncFetcher<T>,
  {
    onError = () => {},
    retryOnError = true,
    revalidate: revalidateEvery = 60,
    ...options
  }: UseDataOptions = {}
): UseDataResponse<T> {
  const cache = useContext(DataCacheContext);
  const [data, setData] = useState<AsyncData<Result<T, Error>>>(() =>
    AsyncData.NotAsked()
  );
  // We use this to trigger the revalidation effect with paramters for each revalidation.
  const [retries, setRetry] = useState<RetryState>(() => ({
    count: 0,
    revalidate: false,
  }));

  // Updates the cache value then triggers a revalidation if revalidate is true.
  const mutate: MutateFunction<T> = (data, revalidate = false) => {
    cache.set(url, data);
    setRetry((retries) => ({ count: retries.count + 1, revalidate }));
  };

  // Triggers a retry.
  const retry = () => {
    setRetry((retries) => ({ count: retries.count + 1, revalidate: true }));
  };

  // Starts a fetch and will update the cache on success (only on ok) and update data when future is resolved (on both ok and error).
  const revalidate = () =>
    fetcher(url, options)
      .tapError((error) => {
        if (retryOnError) {
          retry();
        }
        onError(error);
      })
      .tapOk((value) => cache.set(url, value))
      .tap((result) => setData(() => AsyncData.Done(result)))
      .mapOk((value) => value);

  // The revalidation effect.
  useEffect(() => {
    const future = cache.get(url).match({
      // If the cache contains a value then set done with cache value.
      Some: (value) => {
        // We dont set the loading here as the tap will resolve immediately.
        return Future.value(value).tap(() => {
          setData(() => AsyncData.Done(Result.Ok(value)));
          // If a revalidation triggered this then start to revalidate after we've set the state to done.
          // We do this after setting done so that on revalidate interval doesnt push a loading state and wait for it to finish each time.
          if (retries.revalidate) {
            revalidate();
          }
        });
      },
      // If no cache value exists start fetching the data.
      None: () => {
        // Set loading here as we start fetching the data now.
        setData(() => AsyncData.Loading());
        return revalidate();
      },
    });

    // Start the revalidate timer. This gets destroyed on before each effect and starts a new one, so a new timeout gets created on each revalidation.
    // We only create the timeout if the revalidate option is not falsey.
    const revalidationTimeout: NodeJS.Timeout | undefined = !revalidateEvery ? undefined : setTimeout(retry, revalidateEvery * 1000);

    return () => {
      // Cancel the revalidation future.
      future.cancel();
      // Clear the revalidation timer so we dont made multiple revalidation triggers occuring for one hook.
      clearTimeout(revalidationTimeout);
    };
  }, [url, retries]);

  return { data, mutate, retry };
}

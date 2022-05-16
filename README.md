# use-boxed-data

[![mit licence](https://img.shields.io/dub/l/vibe-d.svg?style=for-the-badge)](https://github.com/greym0uth/use-boxed-data/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/use-boxed-data?style=for-the-badge)](https://www.npmjs.org/package/use-boxed-data)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/use-boxed-data?label=size&style=for-the-badge)](https://bundlephobia.com/result?p=use-boxed-data)

> React data-fetching using [boxed](https://github.com/swan-io/boxed)

**use-boxed-data** provides a simple data fetching hook inspired by [SWR](https://swr.vercel.app/).

## Design principles

- Provide simple hook for cancellable requests that returns `AsyncData`.
- compatibility with any request framework (fetch, axios, etc.).
- Ability to caching requests with fallback support.
- Automatic revalidation.
- Mutate local cache immediately and revalidate from remote asynchronously.

## What's in the box?

- `DataCacheConfig`
- `useData`

## Installation

```bash
$ pnpm add use-boxed-data
# --- or ---
$ yarn add use-boxed-data
# --- or ---
$ npm install --save use-boxed-data
```

## Usage

``` tsx
import { Future, Result } from '@swan-io/boxed';
import { AsyncData, AysncFetcher, useData } from 'use-boxed-data';

const fetcher: AsyncFetcher<CoolStuff> = (url: string, ...options: any[]) =>
  Future.make((resolve) =>
    fetch(url, options)
      .then((response) => response.json())
      .then((data) => resolve(Result.Ok(data)))
      .catch((err) => resolve(Result.Error(err))));

const MyAsyncComponent = () => {
  const { data, retry } = useData('/api/cool-stuff', fetcher);

  return data.match({
    Done: (result) =>
      result.match({
        Ok: (stuff) => {
          return <LoadedData cool={stuff} />;
        },
        Error: () => <Error onRetry={retry} />,
      }),
    Loading: () => <Loading />,
    NotAsked: () => <Loading />,
  });
}
```

## Links

- 📘 [**Boxed Documentation**](https://swan-io.github.io/boxed)
- ⚖️ [**License**](./LICENSE)

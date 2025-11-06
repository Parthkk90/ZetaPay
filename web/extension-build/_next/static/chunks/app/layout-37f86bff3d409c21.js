(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([[3185],{

/***/ 18210:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 91664));
;
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 94860, 23));
;
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 64299, 23));


/***/ }),

/***/ 91664:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Providers: function() { return /* binding */ Providers; }
});

// EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(57437);
// EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/index.js
var react = __webpack_require__(2265);
// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/modern/utils.js
var utils = __webpack_require__(45345);
// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/modern/query.js
var modern_query = __webpack_require__(21733);
// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/modern/notifyManager.js
var notifyManager = __webpack_require__(18238);
// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/modern/subscribable.js
var subscribable = __webpack_require__(24112);
;// CONCATENATED MODULE: ./node_modules/@tanstack/query-core/build/modern/queryCache.js
// src/queryCache.ts




var QueryCache = class extends subscribable/* Subscribable */.l {
  constructor(config = {}) {
    super();
    this.config = config;
    this.#queries = /* @__PURE__ */ new Map();
  }
  #queries;
  build(client, options, state) {
    const queryKey = options.queryKey;
    const queryHash = options.queryHash ?? (0,utils/* hashQueryKeyByOptions */.Rm)(queryKey, options);
    let query = this.get(queryHash);
    if (!query) {
      query = new modern_query/* Query */.A({
        cache: this,
        queryKey,
        queryHash,
        options: client.defaultQueryOptions(options),
        state,
        defaultOptions: client.getQueryDefaults(queryKey)
      });
      this.add(query);
    }
    return query;
  }
  add(query) {
    if (!this.#queries.has(query.queryHash)) {
      this.#queries.set(query.queryHash, query);
      this.notify({
        type: "added",
        query
      });
    }
  }
  remove(query) {
    const queryInMap = this.#queries.get(query.queryHash);
    if (queryInMap) {
      query.destroy();
      if (queryInMap === query) {
        this.#queries.delete(query.queryHash);
      }
      this.notify({ type: "removed", query });
    }
  }
  clear() {
    notifyManager/* notifyManager */.V.batch(() => {
      this.getAll().forEach((query) => {
        this.remove(query);
      });
    });
  }
  get(queryHash) {
    return this.#queries.get(queryHash);
  }
  getAll() {
    return [...this.#queries.values()];
  }
  find(filters) {
    const defaultedFilters = { exact: true, ...filters };
    return this.getAll().find(
      (query) => (0,utils/* matchQuery */._x)(defaultedFilters, query)
    );
  }
  findAll(filters = {}) {
    const queries = this.getAll();
    return Object.keys(filters).length > 0 ? queries.filter((query) => (0,utils/* matchQuery */._x)(filters, query)) : queries;
  }
  notify(event) {
    notifyManager/* notifyManager */.V.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event);
      });
    });
  }
  onFocus() {
    notifyManager/* notifyManager */.V.batch(() => {
      this.getAll().forEach((query) => {
        query.onFocus();
      });
    });
  }
  onOnline() {
    notifyManager/* notifyManager */.V.batch(() => {
      this.getAll().forEach((query) => {
        query.onOnline();
      });
    });
  }
};

//# sourceMappingURL=queryCache.js.map
// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/modern/mutation.js
var modern_mutation = __webpack_require__(2894);
;// CONCATENATED MODULE: ./node_modules/@tanstack/query-core/build/modern/mutationCache.js
// src/mutationCache.ts




var MutationCache = class extends subscribable/* Subscribable */.l {
  constructor(config = {}) {
    super();
    this.config = config;
    this.#mutations = /* @__PURE__ */ new Map();
    this.#mutationId = Date.now();
  }
  #mutations;
  #mutationId;
  build(client, options, state) {
    const mutation = new modern_mutation/* Mutation */.m({
      mutationCache: this,
      mutationId: ++this.#mutationId,
      options: client.defaultMutationOptions(options),
      state
    });
    this.add(mutation);
    return mutation;
  }
  add(mutation) {
    const scope = scopeFor(mutation);
    const mutations = this.#mutations.get(scope) ?? [];
    mutations.push(mutation);
    this.#mutations.set(scope, mutations);
    this.notify({ type: "added", mutation });
  }
  remove(mutation) {
    const scope = scopeFor(mutation);
    if (this.#mutations.has(scope)) {
      const mutations = this.#mutations.get(scope)?.filter((x) => x !== mutation);
      if (mutations) {
        if (mutations.length === 0) {
          this.#mutations.delete(scope);
        } else {
          this.#mutations.set(scope, mutations);
        }
      }
    }
    this.notify({ type: "removed", mutation });
  }
  canRun(mutation) {
    const firstPendingMutation = this.#mutations.get(scopeFor(mutation))?.find((m) => m.state.status === "pending");
    return !firstPendingMutation || firstPendingMutation === mutation;
  }
  runNext(mutation) {
    const foundMutation = this.#mutations.get(scopeFor(mutation))?.find((m) => m !== mutation && m.state.isPaused);
    return foundMutation?.continue() ?? Promise.resolve();
  }
  clear() {
    notifyManager/* notifyManager */.V.batch(() => {
      this.getAll().forEach((mutation) => {
        this.remove(mutation);
      });
    });
  }
  getAll() {
    return [...this.#mutations.values()].flat();
  }
  find(filters) {
    const defaultedFilters = { exact: true, ...filters };
    return this.getAll().find(
      (mutation) => (0,utils/* matchMutation */.X7)(defaultedFilters, mutation)
    );
  }
  findAll(filters = {}) {
    return this.getAll().filter((mutation) => (0,utils/* matchMutation */.X7)(filters, mutation));
  }
  notify(event) {
    notifyManager/* notifyManager */.V.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event);
      });
    });
  }
  resumePausedMutations() {
    const pausedMutations = this.getAll().filter((x) => x.state.isPaused);
    return notifyManager/* notifyManager */.V.batch(
      () => Promise.all(
        pausedMutations.map((mutation) => mutation.continue().catch(utils/* noop */.ZT))
      )
    );
  }
};
function scopeFor(mutation) {
  return mutation.options.scope?.id ?? String(mutation.mutationId);
}

//# sourceMappingURL=mutationCache.js.map
// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/modern/focusManager.js
var focusManager = __webpack_require__(87045);
// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/modern/onlineManager.js
var onlineManager = __webpack_require__(57853);
;// CONCATENATED MODULE: ./node_modules/@tanstack/query-core/build/modern/infiniteQueryBehavior.js
// src/infiniteQueryBehavior.ts

function infiniteQueryBehavior(pages) {
  return {
    onFetch: (context, query) => {
      const options = context.options;
      const direction = context.fetchOptions?.meta?.fetchMore?.direction;
      const oldPages = context.state.data?.pages || [];
      const oldPageParams = context.state.data?.pageParams || [];
      let result = { pages: [], pageParams: [] };
      let currentPage = 0;
      const fetchFn = async () => {
        let cancelled = false;
        const addSignalProperty = (object) => {
          Object.defineProperty(object, "signal", {
            enumerable: true,
            get: () => {
              if (context.signal.aborted) {
                cancelled = true;
              } else {
                context.signal.addEventListener("abort", () => {
                  cancelled = true;
                });
              }
              return context.signal;
            }
          });
        };
        const queryFn = (0,utils/* ensureQueryFn */.cG)(context.options, context.fetchOptions);
        const fetchPage = async (data, param, previous) => {
          if (cancelled) {
            return Promise.reject();
          }
          if (param == null && data.pages.length) {
            return Promise.resolve(data);
          }
          const queryFnContext = {
            queryKey: context.queryKey,
            pageParam: param,
            direction: previous ? "backward" : "forward",
            meta: context.options.meta
          };
          addSignalProperty(queryFnContext);
          const page = await queryFn(
            queryFnContext
          );
          const { maxPages } = context.options;
          const addTo = previous ? utils/* addToStart */.Ht : utils/* addToEnd */.VX;
          return {
            pages: addTo(data.pages, page, maxPages),
            pageParams: addTo(data.pageParams, param, maxPages)
          };
        };
        if (direction && oldPages.length) {
          const previous = direction === "backward";
          const pageParamFn = previous ? getPreviousPageParam : getNextPageParam;
          const oldData = {
            pages: oldPages,
            pageParams: oldPageParams
          };
          const param = pageParamFn(options, oldData);
          result = await fetchPage(oldData, param, previous);
        } else {
          const remainingPages = pages ?? oldPages.length;
          do {
            const param = currentPage === 0 ? oldPageParams[0] ?? options.initialPageParam : getNextPageParam(options, result);
            if (currentPage > 0 && param == null) {
              break;
            }
            result = await fetchPage(result, param);
            currentPage++;
          } while (currentPage < remainingPages);
        }
        return result;
      };
      if (context.options.persister) {
        context.fetchFn = () => {
          return context.options.persister?.(
            fetchFn,
            {
              queryKey: context.queryKey,
              meta: context.options.meta,
              signal: context.signal
            },
            query
          );
        };
      } else {
        context.fetchFn = fetchFn;
      }
    }
  };
}
function getNextPageParam(options, { pages, pageParams }) {
  const lastIndex = pages.length - 1;
  return pages.length > 0 ? options.getNextPageParam(
    pages[lastIndex],
    pages,
    pageParams[lastIndex],
    pageParams
  ) : void 0;
}
function getPreviousPageParam(options, { pages, pageParams }) {
  return pages.length > 0 ? options.getPreviousPageParam?.(pages[0], pages, pageParams[0], pageParams) : void 0;
}
function hasNextPage(options, data) {
  if (!data)
    return false;
  return getNextPageParam(options, data) != null;
}
function hasPreviousPage(options, data) {
  if (!data || !options.getPreviousPageParam)
    return false;
  return getPreviousPageParam(options, data) != null;
}

//# sourceMappingURL=infiniteQueryBehavior.js.map
;// CONCATENATED MODULE: ./node_modules/@tanstack/query-core/build/modern/queryClient.js
// src/queryClient.ts







var QueryClient = class {
  #queryCache;
  #mutationCache;
  #defaultOptions;
  #queryDefaults;
  #mutationDefaults;
  #mountCount;
  #unsubscribeFocus;
  #unsubscribeOnline;
  constructor(config = {}) {
    this.#queryCache = config.queryCache || new QueryCache();
    this.#mutationCache = config.mutationCache || new MutationCache();
    this.#defaultOptions = config.defaultOptions || {};
    this.#queryDefaults = /* @__PURE__ */ new Map();
    this.#mutationDefaults = /* @__PURE__ */ new Map();
    this.#mountCount = 0;
  }
  mount() {
    this.#mountCount++;
    if (this.#mountCount !== 1)
      return;
    this.#unsubscribeFocus = focusManager/* focusManager */.j.subscribe(async (focused) => {
      if (focused) {
        await this.resumePausedMutations();
        this.#queryCache.onFocus();
      }
    });
    this.#unsubscribeOnline = onlineManager/* onlineManager */.N.subscribe(async (online) => {
      if (online) {
        await this.resumePausedMutations();
        this.#queryCache.onOnline();
      }
    });
  }
  unmount() {
    this.#mountCount--;
    if (this.#mountCount !== 0)
      return;
    this.#unsubscribeFocus?.();
    this.#unsubscribeFocus = void 0;
    this.#unsubscribeOnline?.();
    this.#unsubscribeOnline = void 0;
  }
  isFetching(filters) {
    return this.#queryCache.findAll({ ...filters, fetchStatus: "fetching" }).length;
  }
  isMutating(filters) {
    return this.#mutationCache.findAll({ ...filters, status: "pending" }).length;
  }
  getQueryData(queryKey) {
    const options = this.defaultQueryOptions({ queryKey });
    return this.#queryCache.get(options.queryHash)?.state.data;
  }
  ensureQueryData(options) {
    const cachedData = this.getQueryData(options.queryKey);
    if (cachedData === void 0) {
      return this.fetchQuery(options);
    } else {
      const defaultedOptions = this.defaultQueryOptions(options);
      const query = this.#queryCache.build(this, defaultedOptions);
      if (options.revalidateIfStale && query.isStaleByTime((0,utils/* resolveStaleTime */.KC)(defaultedOptions.staleTime, query))) {
        void this.prefetchQuery(defaultedOptions);
      }
      return Promise.resolve(cachedData);
    }
  }
  getQueriesData(filters) {
    return this.#queryCache.findAll(filters).map(({ queryKey, state }) => {
      const data = state.data;
      return [queryKey, data];
    });
  }
  setQueryData(queryKey, updater, options) {
    const defaultedOptions = this.defaultQueryOptions({ queryKey });
    const query = this.#queryCache.get(
      defaultedOptions.queryHash
    );
    const prevData = query?.state.data;
    const data = (0,utils/* functionalUpdate */.SE)(updater, prevData);
    if (data === void 0) {
      return void 0;
    }
    return this.#queryCache.build(this, defaultedOptions).setData(data, { ...options, manual: true });
  }
  setQueriesData(filters, updater, options) {
    return notifyManager/* notifyManager */.V.batch(
      () => this.#queryCache.findAll(filters).map(({ queryKey }) => [
        queryKey,
        this.setQueryData(queryKey, updater, options)
      ])
    );
  }
  getQueryState(queryKey) {
    const options = this.defaultQueryOptions({ queryKey });
    return this.#queryCache.get(
      options.queryHash
    )?.state;
  }
  removeQueries(filters) {
    const queryCache = this.#queryCache;
    notifyManager/* notifyManager */.V.batch(() => {
      queryCache.findAll(filters).forEach((query) => {
        queryCache.remove(query);
      });
    });
  }
  resetQueries(filters, options) {
    const queryCache = this.#queryCache;
    const refetchFilters = {
      type: "active",
      ...filters
    };
    return notifyManager/* notifyManager */.V.batch(() => {
      queryCache.findAll(filters).forEach((query) => {
        query.reset();
      });
      return this.refetchQueries(refetchFilters, options);
    });
  }
  cancelQueries(filters, cancelOptions = {}) {
    const defaultedCancelOptions = { revert: true, ...cancelOptions };
    const promises = notifyManager/* notifyManager */.V.batch(
      () => this.#queryCache.findAll(filters).map((query) => query.cancel(defaultedCancelOptions))
    );
    return Promise.all(promises).then(utils/* noop */.ZT).catch(utils/* noop */.ZT);
  }
  invalidateQueries(filters, options = {}) {
    return notifyManager/* notifyManager */.V.batch(() => {
      this.#queryCache.findAll(filters).forEach((query) => {
        query.invalidate();
      });
      if (filters?.refetchType === "none") {
        return Promise.resolve();
      }
      const refetchFilters = {
        ...filters,
        type: filters?.refetchType ?? filters?.type ?? "active"
      };
      return this.refetchQueries(refetchFilters, options);
    });
  }
  refetchQueries(filters, options = {}) {
    const fetchOptions = {
      ...options,
      cancelRefetch: options.cancelRefetch ?? true
    };
    const promises = notifyManager/* notifyManager */.V.batch(
      () => this.#queryCache.findAll(filters).filter((query) => !query.isDisabled()).map((query) => {
        let promise = query.fetch(void 0, fetchOptions);
        if (!fetchOptions.throwOnError) {
          promise = promise.catch(utils/* noop */.ZT);
        }
        return query.state.fetchStatus === "paused" ? Promise.resolve() : promise;
      })
    );
    return Promise.all(promises).then(utils/* noop */.ZT);
  }
  fetchQuery(options) {
    const defaultedOptions = this.defaultQueryOptions(options);
    if (defaultedOptions.retry === void 0) {
      defaultedOptions.retry = false;
    }
    const query = this.#queryCache.build(this, defaultedOptions);
    return query.isStaleByTime(
      (0,utils/* resolveStaleTime */.KC)(defaultedOptions.staleTime, query)
    ) ? query.fetch(defaultedOptions) : Promise.resolve(query.state.data);
  }
  prefetchQuery(options) {
    return this.fetchQuery(options).then(utils/* noop */.ZT).catch(utils/* noop */.ZT);
  }
  fetchInfiniteQuery(options) {
    options.behavior = infiniteQueryBehavior(options.pages);
    return this.fetchQuery(options);
  }
  prefetchInfiniteQuery(options) {
    return this.fetchInfiniteQuery(options).then(utils/* noop */.ZT).catch(utils/* noop */.ZT);
  }
  ensureInfiniteQueryData(options) {
    options.behavior = infiniteQueryBehavior(options.pages);
    return this.ensureQueryData(options);
  }
  resumePausedMutations() {
    if (onlineManager/* onlineManager */.N.isOnline()) {
      return this.#mutationCache.resumePausedMutations();
    }
    return Promise.resolve();
  }
  getQueryCache() {
    return this.#queryCache;
  }
  getMutationCache() {
    return this.#mutationCache;
  }
  getDefaultOptions() {
    return this.#defaultOptions;
  }
  setDefaultOptions(options) {
    this.#defaultOptions = options;
  }
  setQueryDefaults(queryKey, options) {
    this.#queryDefaults.set((0,utils/* hashKey */.Ym)(queryKey), {
      queryKey,
      defaultOptions: options
    });
  }
  getQueryDefaults(queryKey) {
    const defaults = [...this.#queryDefaults.values()];
    const result = {};
    defaults.forEach((queryDefault) => {
      if ((0,utils/* partialMatchKey */.to)(queryKey, queryDefault.queryKey)) {
        Object.assign(result, queryDefault.defaultOptions);
      }
    });
    return result;
  }
  setMutationDefaults(mutationKey, options) {
    this.#mutationDefaults.set((0,utils/* hashKey */.Ym)(mutationKey), {
      mutationKey,
      defaultOptions: options
    });
  }
  getMutationDefaults(mutationKey) {
    const defaults = [...this.#mutationDefaults.values()];
    let result = {};
    defaults.forEach((queryDefault) => {
      if ((0,utils/* partialMatchKey */.to)(mutationKey, queryDefault.mutationKey)) {
        result = { ...result, ...queryDefault.defaultOptions };
      }
    });
    return result;
  }
  defaultQueryOptions(options) {
    if (options._defaulted) {
      return options;
    }
    const defaultedOptions = {
      ...this.#defaultOptions.queries,
      ...this.getQueryDefaults(options.queryKey),
      ...options,
      _defaulted: true
    };
    if (!defaultedOptions.queryHash) {
      defaultedOptions.queryHash = (0,utils/* hashQueryKeyByOptions */.Rm)(
        defaultedOptions.queryKey,
        defaultedOptions
      );
    }
    if (defaultedOptions.refetchOnReconnect === void 0) {
      defaultedOptions.refetchOnReconnect = defaultedOptions.networkMode !== "always";
    }
    if (defaultedOptions.throwOnError === void 0) {
      defaultedOptions.throwOnError = !!defaultedOptions.suspense;
    }
    if (!defaultedOptions.networkMode && defaultedOptions.persister) {
      defaultedOptions.networkMode = "offlineFirst";
    }
    if (defaultedOptions.queryFn === utils/* skipToken */.CN) {
      defaultedOptions.enabled = false;
    }
    return defaultedOptions;
  }
  defaultMutationOptions(options) {
    if (options?._defaulted) {
      return options;
    }
    return {
      ...this.#defaultOptions.mutations,
      ...options?.mutationKey && this.getMutationDefaults(options.mutationKey),
      ...options,
      _defaulted: true
    };
  }
  clear() {
    this.#queryCache.clear();
    this.#mutationCache.clear();
  }
};

//# sourceMappingURL=queryClient.js.map
// EXTERNAL MODULE: ./node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js
var QueryClientProvider = __webpack_require__(29827);
// EXTERNAL MODULE: ./node_modules/wagmi/dist/esm/context.js + 3 modules
var context = __webpack_require__(10231);
// EXTERNAL MODULE: ./node_modules/@rainbow-me/rainbowkit/dist/chunk-DQLAW7KN.js
var chunk_DQLAW7KN = __webpack_require__(19667);
;// CONCATENATED MODULE: ./node_modules/@rainbow-me/rainbowkit/dist/chunk-RZWDCITT.js
/* __next_internal_client_entry_do_not_use__ darkTheme auto */ 
// src/themes/darkTheme.ts
var darkGrey = "#1A1B1F";
var accentColors = {
    blue: {
        accentColor: "#3898FF",
        accentColorForeground: "#FFF"
    },
    green: {
        accentColor: "#4BD166",
        accentColorForeground: darkGrey
    },
    orange: {
        accentColor: "#FF983D",
        accentColorForeground: darkGrey
    },
    pink: {
        accentColor: "#FF7AB8",
        accentColorForeground: darkGrey
    },
    purple: {
        accentColor: "#7A70FF",
        accentColorForeground: "#FFF"
    },
    red: {
        accentColor: "#FF6257",
        accentColorForeground: "#FFF"
    }
};
var defaultAccentColor = accentColors.blue;
var darkTheme = function() {
    let { accentColor = defaultAccentColor.accentColor, accentColorForeground = defaultAccentColor.accentColorForeground, ...baseThemeOptions } = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return {
        ...(0,chunk_DQLAW7KN/* baseTheme */.w)(baseThemeOptions),
        colors: {
            accentColor,
            accentColorForeground,
            actionButtonBorder: "rgba(255, 255, 255, 0.04)",
            actionButtonBorderMobile: "rgba(255, 255, 255, 0.08)",
            actionButtonSecondaryBackground: "rgba(255, 255, 255, 0.08)",
            closeButton: "rgba(224, 232, 255, 0.6)",
            closeButtonBackground: "rgba(255, 255, 255, 0.08)",
            connectButtonBackground: darkGrey,
            connectButtonBackgroundError: "#FF494A",
            connectButtonInnerBackground: "linear-gradient(0deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.15))",
            connectButtonText: "#FFF",
            connectButtonTextError: "#FFF",
            connectionIndicator: "#30E000",
            downloadBottomCardBackground: "linear-gradient(126deg, rgba(0, 0, 0, 0) 9.49%, rgba(120, 120, 120, 0.2) 71.04%), #1A1B1F",
            downloadTopCardBackground: "linear-gradient(126deg, rgba(120, 120, 120, 0.2) 9.49%, rgba(0, 0, 0, 0) 71.04%), #1A1B1F",
            error: "#FF494A",
            generalBorder: "rgba(255, 255, 255, 0.08)",
            generalBorderDim: "rgba(255, 255, 255, 0.04)",
            menuItemBackground: "rgba(224, 232, 255, 0.1)",
            modalBackdrop: "rgba(0, 0, 0, 0.5)",
            modalBackground: "#1A1B1F",
            modalBorder: "rgba(255, 255, 255, 0.08)",
            modalText: "#FFF",
            modalTextDim: "rgba(224, 232, 255, 0.3)",
            modalTextSecondary: "rgba(255, 255, 255, 0.6)",
            profileAction: "rgba(224, 232, 255, 0.1)",
            profileActionHover: "rgba(224, 232, 255, 0.2)",
            profileForeground: "rgba(224, 232, 255, 0.05)",
            selectedOptionBorder: "rgba(224, 232, 255, 0.1)",
            standby: "#FFD641"
        },
        shadows: {
            connectButton: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            dialog: "0px 8px 32px rgba(0, 0, 0, 0.32)",
            profileDetailsAction: "0px 2px 6px rgba(37, 41, 46, 0.04)",
            selectedOption: "0px 2px 6px rgba(0, 0, 0, 0.24)",
            selectedWallet: "0px 2px 6px rgba(0, 0, 0, 0.24)",
            walletLogo: "0px 2px 16px rgba(0, 0, 0, 0.16)"
        }
    };
};
darkTheme.accentColors = accentColors;


// EXTERNAL MODULE: ./node_modules/@rainbow-me/rainbowkit/dist/chunk-72HZGUJA.js
var chunk_72HZGUJA = __webpack_require__(70451);
// EXTERNAL MODULE: ./node_modules/@rainbow-me/rainbowkit/dist/index.js
var dist = __webpack_require__(67872);
// EXTERNAL MODULE: ./node_modules/@zetachain/universalkit/dist/index.js
var universalkit_dist = __webpack_require__(8398);
// EXTERNAL MODULE: ./node_modules/viem/_esm/utils/chain/defineChain.js
var defineChain = __webpack_require__(90328);
;// CONCATENATED MODULE: ./node_modules/viem/_esm/chains/definitions/sepolia.js

const sepolia = /*#__PURE__*/ (0,defineChain/* defineChain */.a)({
    id: 11_155_111,
    name: 'Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://rpc.sepolia.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Etherscan',
            url: 'https://sepolia.etherscan.io',
            apiUrl: 'https://api-sepolia.etherscan.io/api',
        },
    },
    contracts: {
        multicall3: {
            address: '0xca11bde05977b3631167028862be2a173976ca11',
            blockCreated: 751532,
        },
        ensRegistry: { address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' },
        ensUniversalResolver: {
            address: '0xc8Af999e38273D658BE1b921b88A9Ddf005769cC',
            blockCreated: 5_317_080,
        },
    },
    testnet: true,
});
//# sourceMappingURL=sepolia.js.map
;// CONCATENATED MODULE: ./node_modules/viem/_esm/chains/definitions/bscTestnet.js

const bscTestnet = /*#__PURE__*/ (0,defineChain/* defineChain */.a)({
    id: 97,
    name: 'Binance Smart Chain Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'BNB',
        symbol: 'tBNB',
    },
    rpcUrls: {
        default: { http: ['https://data-seed-prebsc-1-s1.bnbchain.org:8545'] },
    },
    blockExplorers: {
        default: {
            name: 'BscScan',
            url: 'https://testnet.bscscan.com',
            apiUrl: 'https://testnet.bscscan.com/api',
        },
    },
    contracts: {
        multicall3: {
            address: '0xca11bde05977b3631167028862be2a173976ca11',
            blockCreated: 17422483,
        },
    },
    testnet: true,
});
//# sourceMappingURL=bscTestnet.js.map
;// CONCATENATED MODULE: ./node_modules/viem/_esm/chains/definitions/zetachainAthensTestnet.js

const zetachainAthensTestnet = /*#__PURE__*/ (0,defineChain/* defineChain */.a)({
    id: 7001,
    name: 'ZetaChain Athens Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Zeta',
        symbol: 'aZETA',
    },
    rpcUrls: {
        default: {
            http: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'],
        },
    },
    blockExplorers: {
        default: {
            name: 'ZetaScan',
            url: 'https://athens.explorer.zetachain.com',
        },
    },
    testnet: true,
});
//# sourceMappingURL=zetachainAthensTestnet.js.map
;// CONCATENATED MODULE: ./src/wagmi.ts


const config = (0,dist/* getDefaultConfig */.vX)({
    appName: "RainbowKit demo",
    projectId: "9dd3b957e87a350c83ab1b87a7fcf40c",
    chains: [
        sepolia,
        bscTestnet,
        zetachainAthensTestnet
    ]
});

// EXTERNAL MODULE: ./node_modules/next-themes/dist/index.mjs
var next_themes_dist = __webpack_require__(25922);
;// CONCATENATED MODULE: ./src/app/providers.tsx
/* __next_internal_client_entry_do_not_use__ Providers auto */ 







const queryClient = new QueryClient();
const ThemeProvider = (param)=>{
    let { children } = param;
    const { theme } = (0,next_themes_dist/* useTheme */.F)();
    const rainbowKitTheme = theme === "dark" ? darkTheme() : (0,chunk_72HZGUJA/* lightTheme */.W)();
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(dist/* RainbowKitProvider */.pj, {
        theme: rainbowKitTheme,
        children: children
    });
};
const WagmiWrapper = (param)=>{
    let { children } = param;
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(universalkit_dist/* UniversalKitProvider */.Vl, {
        config: config,
        client: queryClient,
        children: children
    });
};
const Providers = (param)=>{
    let { children } = param;
    const [mounted, setMounted] = (0,react.useState)(false);
    (0,react.useEffect)(()=>{
        setMounted(true);
    }, []);
    if (!mounted) return null;
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(context/* WagmiProvider */.F, {
        config: config,
        children: /*#__PURE__*/ (0,jsx_runtime.jsx)(QueryClientProvider/* QueryClientProvider */.aH, {
            client: queryClient,
            children: /*#__PURE__*/ (0,jsx_runtime.jsx)(next_themes_dist/* ThemeProvider */.f, {
                attribute: "class",
                defaultTheme: "system",
                enableSystem: true,
                disableTransitionOnChange: true,
                children: /*#__PURE__*/ (0,jsx_runtime.jsx)(WagmiWrapper, {
                    children: /*#__PURE__*/ (0,jsx_runtime.jsx)(ThemeProvider, {
                        children: children
                    })
                })
            })
        })
    });
};


/***/ }),

/***/ 64299:
/***/ (function() {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ 94860:
/***/ (function() {

// extracted by mini-css-extract-plugin

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, [4434,4289,9818,9472,9136,2971,2117,1744], function() { return __webpack_exec__(18210); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ _N_E = __webpack_exports__;
/******/ }
]);
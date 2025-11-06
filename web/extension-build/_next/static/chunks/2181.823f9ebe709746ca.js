"use strict";
(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([[2181],{

/***/ 51672:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_BASE_URL = void 0;
exports.DEFAULT_BASE_URL = 'https://safe-client.safe.global';
//# sourceMappingURL=config.js.map

/***/ }),

/***/ 64661:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getEndpoint = exports.deleteEndpoint = exports.putEndpoint = exports.postEndpoint = void 0;
const utils_1 = __webpack_require__(90963);
function makeUrl(baseUrl, path, pathParams, query) {
    const pathname = (0, utils_1.insertParams)(path, pathParams);
    const search = (0, utils_1.stringifyQuery)(query);
    return `${baseUrl}${pathname}${search}`;
}
function postEndpoint(baseUrl, path, params) {
    const url = makeUrl(baseUrl, path, params === null || params === void 0 ? void 0 : params.path, params === null || params === void 0 ? void 0 : params.query);
    return (0, utils_1.fetchData)(url, 'POST', params === null || params === void 0 ? void 0 : params.body, params === null || params === void 0 ? void 0 : params.headers, params === null || params === void 0 ? void 0 : params.credentials);
}
exports.postEndpoint = postEndpoint;
function putEndpoint(baseUrl, path, params) {
    const url = makeUrl(baseUrl, path, params === null || params === void 0 ? void 0 : params.path, params === null || params === void 0 ? void 0 : params.query);
    return (0, utils_1.fetchData)(url, 'PUT', params === null || params === void 0 ? void 0 : params.body, params === null || params === void 0 ? void 0 : params.headers, params === null || params === void 0 ? void 0 : params.credentials);
}
exports.putEndpoint = putEndpoint;
function deleteEndpoint(baseUrl, path, params) {
    const url = makeUrl(baseUrl, path, params === null || params === void 0 ? void 0 : params.path, params === null || params === void 0 ? void 0 : params.query);
    return (0, utils_1.fetchData)(url, 'DELETE', params === null || params === void 0 ? void 0 : params.body, params === null || params === void 0 ? void 0 : params.headers, params === null || params === void 0 ? void 0 : params.credentials);
}
exports.deleteEndpoint = deleteEndpoint;
function getEndpoint(baseUrl, path, params, rawUrl) {
    if (rawUrl) {
        return (0, utils_1.getData)(rawUrl, undefined, params === null || params === void 0 ? void 0 : params.credentials);
    }
    const url = makeUrl(baseUrl, path, params === null || params === void 0 ? void 0 : params.path, params === null || params === void 0 ? void 0 : params.query);
    return (0, utils_1.getData)(url, params === null || params === void 0 ? void 0 : params.headers, params === null || params === void 0 ? void 0 : params.credentials);
}
exports.getEndpoint = getEndpoint;
//# sourceMappingURL=endpoint.js.map

/***/ }),

/***/ 42181:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getAccount = exports.createAccount = exports.verifyAuth = exports.getAuthNonce = exports.getContract = exports.getSafeOverviews = exports.unsubscribeAll = exports.unsubscribeSingle = exports.registerRecoveryModule = exports.deleteRegisteredEmail = exports.getRegisteredEmail = exports.verifyEmail = exports.resendEmailVerificationCode = exports.changeEmail = exports.registerEmail = exports.unregisterDevice = exports.unregisterSafe = exports.registerDevice = exports.getDelegates = exports.confirmSafeMessage = exports.proposeSafeMessage = exports.getSafeMessage = exports.getSafeMessages = exports.getDecodedData = exports.getMasterCopies = exports.getSafeApps = exports.getChainConfig = exports.getChainsConfig = exports.getTxPreview = exports.getConfirmationView = exports.proposeTransaction = exports.getNonces = exports.postSafeGasEstimation = exports.deleteTransaction = exports.getTransactionDetails = exports.getTransactionQueue = exports.getTransactionHistory = exports.getCollectiblesPage = exports.getCollectibles = exports.getAllOwnedSafes = exports.getOwnedSafes = exports.getFiatCurrencies = exports.getBalances = exports.getMultisigTransactions = exports.getModuleTransactions = exports.getIncomingTransfers = exports.getSafeInfo = exports.getRelayCount = exports.relayTransaction = exports.setBaseUrl = void 0;
exports.getIndexingStatus = exports.putAccountDataSettings = exports.getAccountDataSettings = exports.getAccountDataTypes = exports.deleteAccount = void 0;
const endpoint_1 = __webpack_require__(64661);
const config_1 = __webpack_require__(51672);
__exportStar(__webpack_require__(40525), exports);
__exportStar(__webpack_require__(85940), exports);
__exportStar(__webpack_require__(66136), exports);
__exportStar(__webpack_require__(3950), exports);
__exportStar(__webpack_require__(46143), exports);
__exportStar(__webpack_require__(33421), exports);
__exportStar(__webpack_require__(46257), exports);
__exportStar(__webpack_require__(89153), exports);
__exportStar(__webpack_require__(92916), exports);
__exportStar(__webpack_require__(87633), exports);
// Can be set externally to a different CGW host
let baseUrl = config_1.DEFAULT_BASE_URL;
/**
 * Set the base CGW URL
 */
const setBaseUrl = (url) => {
    baseUrl = url;
};
exports.setBaseUrl = setBaseUrl;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * Relay a transaction from a Safe
 */
function relayTransaction(chainId, body) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/relay', { path: { chainId }, body });
}
exports.relayTransaction = relayTransaction;
/**
 * Get the relay limit and number of remaining relays remaining
 */
function getRelayCount(chainId, address) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/relay/{address}', { path: { chainId, address } });
}
exports.getRelayCount = getRelayCount;
/**
 * Get basic information about a Safe. E.g. owners, modules, version etc
 */
function getSafeInfo(chainId, address) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}', { path: { chainId, address } });
}
exports.getSafeInfo = getSafeInfo;
/**
 * Get filterable list of incoming transactions
 */
function getIncomingTransfers(chainId, address, query, pageUrl) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}/incoming-transfers/', {
        path: { chainId, address },
        query,
    }, pageUrl);
}
exports.getIncomingTransfers = getIncomingTransfers;
/**
 * Get filterable list of module transactions
 */
function getModuleTransactions(chainId, address, query, pageUrl) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}/module-transactions/', {
        path: { chainId, address },
        query,
    }, pageUrl);
}
exports.getModuleTransactions = getModuleTransactions;
/**
 * Get filterable list of multisig transactions
 */
function getMultisigTransactions(chainId, address, query, pageUrl) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}/multisig-transactions/', {
        path: { chainId, address },
        query,
    }, pageUrl);
}
exports.getMultisigTransactions = getMultisigTransactions;
/**
 * Get the total balance and all assets stored in a Safe
 */
function getBalances(chainId, address, currency = 'usd', query = {}) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}/balances/{currency}', {
        path: { chainId, address, currency },
        query,
    });
}
exports.getBalances = getBalances;
/**
 * Get a list of supported fiat currencies (e.g. USD, EUR etc)
 */
function getFiatCurrencies() {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/balances/supported-fiat-codes');
}
exports.getFiatCurrencies = getFiatCurrencies;
/**
 * Get the addresses of all Safes belonging to an owner
 */
function getOwnedSafes(chainId, address) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/owners/{address}/safes', { path: { chainId, address } });
}
exports.getOwnedSafes = getOwnedSafes;
/**
 * Get the addresses of all Safes belonging to an owner on all chains
 */
function getAllOwnedSafes(address) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/owners/{address}/safes', { path: { address } });
}
exports.getAllOwnedSafes = getAllOwnedSafes;
/**
 * Get NFTs stored in a Safe
 */
function getCollectibles(chainId, address, query = {}) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}/collectibles', {
        path: { chainId, address },
        query,
    });
}
exports.getCollectibles = getCollectibles;
/**
 * Get NFTs stored in a Safe
 */
function getCollectiblesPage(chainId, address, query = {}, pageUrl) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v2/chains/{chainId}/safes/{address}/collectibles', { path: { chainId, address }, query }, pageUrl);
}
exports.getCollectiblesPage = getCollectiblesPage;
/**
 * Get a list of past Safe transactions
 */
function getTransactionHistory(chainId, address, query = {}, pageUrl) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/transactions/history', { path: { chainId, safe_address: address }, query }, pageUrl);
}
exports.getTransactionHistory = getTransactionHistory;
/**
 * Get the list of pending transactions
 */
function getTransactionQueue(chainId, address, query = {}, pageUrl) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/transactions/queued', { path: { chainId, safe_address: address }, query }, pageUrl);
}
exports.getTransactionQueue = getTransactionQueue;
/**
 * Get the details of an individual transaction by its id
 */
function getTransactionDetails(chainId, transactionId) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/transactions/{transactionId}', {
        path: { chainId, transactionId },
    });
}
exports.getTransactionDetails = getTransactionDetails;
/**
 * Delete a transaction by its safeTxHash
 */
function deleteTransaction(chainId, safeTxHash, signature) {
    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/chains/{chainId}/transactions/{safeTxHash}', {
        path: { chainId, safeTxHash },
        body: { signature },
    });
}
exports.deleteTransaction = deleteTransaction;
/**
 * Request a gas estimate & recommmended tx nonce for a created transaction
 */
function postSafeGasEstimation(chainId, address, body) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v2/chains/{chainId}/safes/{safe_address}/multisig-transactions/estimations', {
        path: { chainId, safe_address: address },
        body,
    });
}
exports.postSafeGasEstimation = postSafeGasEstimation;
function getNonces(chainId, address) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/nonces', {
        path: { chainId, safe_address: address },
    });
}
exports.getNonces = getNonces;
/**
 * Propose a new transaction for other owners to sign/execute
 */
function proposeTransaction(chainId, address, body) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/transactions/{safe_address}/propose', {
        path: { chainId, safe_address: address },
        body,
    });
}
exports.proposeTransaction = proposeTransaction;
/**
 * Returns decoded data
 */
function getConfirmationView(chainId, safeAddress, data, to, value) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/views/transaction-confirmation', {
        path: { chainId, safe_address: safeAddress },
        body: { data, to, value },
    });
}
exports.getConfirmationView = getConfirmationView;
/**
 * Get a tx preview
 */
function getTxPreview(chainId, safeAddress, data, to, value) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/transactions/{safe_address}/preview', {
        path: { chainId, safe_address: safeAddress },
        body: { data, to, value },
    });
}
exports.getTxPreview = getTxPreview;
/**
 * Returns all defined chain configs
 */
function getChainsConfig(query) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains', {
        query,
    });
}
exports.getChainsConfig = getChainsConfig;
/**
 * Returns a chain config
 */
function getChainConfig(chainId) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}', {
        path: { chainId: chainId },
    });
}
exports.getChainConfig = getChainConfig;
/**
 * Returns Safe Apps List
 */
function getSafeApps(chainId, query = {}) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safe-apps', {
        path: { chainId: chainId },
        query,
    });
}
exports.getSafeApps = getSafeApps;
/**
 * Returns list of Master Copies
 */
function getMasterCopies(chainId) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/about/master-copies', {
        path: { chainId: chainId },
    });
}
exports.getMasterCopies = getMasterCopies;
/**
 * Returns decoded data
 */
function getDecodedData(chainId, encodedData, to) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/data-decoder', {
        path: { chainId: chainId },
        body: { data: encodedData, to },
    });
}
exports.getDecodedData = getDecodedData;
/**
 * Returns list of `SafeMessage`s
 */
function getSafeMessages(chainId, address, pageUrl) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/messages', { path: { chainId, safe_address: address }, query: {} }, pageUrl);
}
exports.getSafeMessages = getSafeMessages;
/**
 * Returns a `SafeMessage`
 */
function getSafeMessage(chainId, messageHash) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/messages/{message_hash}', {
        path: { chainId, message_hash: messageHash },
    });
}
exports.getSafeMessage = getSafeMessage;
/**
 * Propose a new `SafeMessage` for other owners to sign
 */
function proposeSafeMessage(chainId, address, body) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/messages', {
        path: { chainId, safe_address: address },
        body,
    });
}
exports.proposeSafeMessage = proposeSafeMessage;
/**
 * Add a confirmation to a `SafeMessage`
 */
function confirmSafeMessage(chainId, messageHash, body) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/messages/{message_hash}/signatures', {
        path: { chainId, message_hash: messageHash },
        body,
    });
}
exports.confirmSafeMessage = confirmSafeMessage;
/**
 * Returns a list of delegates
 */
function getDelegates(chainId, query = {}) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v2/chains/{chainId}/delegates', {
        path: { chainId },
        query,
    });
}
exports.getDelegates = getDelegates;
/**
 * Registers a device/Safe for notifications
 */
function registerDevice(body) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/register/notifications', {
        body,
    });
}
exports.registerDevice = registerDevice;
/**
 * Unregisters a Safe from notifications
 */
function unregisterSafe(chainId, address, uuid) {
    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/chains/{chainId}/notifications/devices/{uuid}/safes/{safe_address}', {
        path: { chainId, safe_address: address, uuid },
    });
}
exports.unregisterSafe = unregisterSafe;
/**
 * Unregisters a device from notifications
 */
function unregisterDevice(chainId, uuid) {
    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/chains/{chainId}/notifications/devices/{uuid}', {
        path: { chainId, uuid },
    });
}
exports.unregisterDevice = unregisterDevice;
/**
 * Registers a email address for a safe signer.
 *
 * The signer wallet has to sign a message of format: `email-register-{chainId}-{safeAddress}-{emailAddress}-{signer}-{timestamp}`
 * The signature is valid for 5 minutes.
 *
 * @param chainId
 * @param safeAddress
 * @param body Signer address and email address
 * @param headers Signature and Signature timestamp
 * @returns 200 if signature matches the data
 */
function registerEmail(chainId, safeAddress, body, headers) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails', {
        path: { chainId, safe_address: safeAddress },
        body,
        headers,
    });
}
exports.registerEmail = registerEmail;
/**
 * Changes an already registered email address for a safe signer. The new email address still needs to be verified.
 *
 * The signer wallet has to sign a message of format: `email-edit-{chainId}-{safeAddress}-{emailAddress}-{signer}-{timestamp}`
 * The signature is valid for 5 minutes.
 *
 * @param chainId
 * @param safeAddress
 * @param signerAddress
 * @param body New email address
 * @param headers Signature and Signature timestamp
 * @returns 202 if signature matches the data
 */
function changeEmail(chainId, safeAddress, signerAddress, body, headers) {
    return (0, endpoint_1.putEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails/{signer}', {
        path: { chainId, safe_address: safeAddress, signer: signerAddress },
        body,
        headers,
    });
}
exports.changeEmail = changeEmail;
/**
 * Resends an email verification code.
 */
function resendEmailVerificationCode(chainId, safeAddress, signerAddress) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails/{signer}/verify-resend', {
        path: { chainId, safe_address: safeAddress, signer: signerAddress },
        body: '',
    });
}
exports.resendEmailVerificationCode = resendEmailVerificationCode;
/**
 * Verifies a pending email address registration.
 *
 * @param chainId
 * @param safeAddress
 * @param signerAddress address who signed the email registration
 * @param body Verification code
 */
function verifyEmail(chainId, safeAddress, signerAddress, body) {
    return (0, endpoint_1.putEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails/{signer}/verify', {
        path: { chainId, safe_address: safeAddress, signer: signerAddress },
        body,
    });
}
exports.verifyEmail = verifyEmail;
/**
 * Gets the registered email address of the signer
 *
 * The signer wallet will have to sign a message of format: `email-retrieval-{chainId}-{safe}-{signer}-{timestamp}`
 * The signature is valid for 5 minutes.
 *
 * @param chainId
 * @param safeAddress
 * @param signerAddress address of the owner of the Safe
 *
 * @returns email address and verified flag
 */
function getRegisteredEmail(chainId, safeAddress, signerAddress, headers) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails/{signer}', {
        path: { chainId, safe_address: safeAddress, signer: signerAddress },
        headers,
    });
}
exports.getRegisteredEmail = getRegisteredEmail;
/**
 * Delete a registered email address for the signer
 *
 * The signer wallet will have to sign a message of format: `email-delete-{chainId}-{safe}-{signer}-{timestamp}`
 * The signature is valid for 5 minutes.
 *
 * @param chainId
 * @param safeAddress
 * @param signerAddress
 * @param headers
 */
function deleteRegisteredEmail(chainId, safeAddress, signerAddress, headers) {
    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails/{signer}', {
        path: { chainId, safe_address: safeAddress, signer: signerAddress },
        headers,
    });
}
exports.deleteRegisteredEmail = deleteRegisteredEmail;
/**
 * Register a recovery module for receiving alerts
 * @param chainId
 * @param safeAddress
 * @param body - { moduleAddress: string }
 */
function registerRecoveryModule(chainId, safeAddress, body) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/recovery', {
        path: { chainId, safe_address: safeAddress },
        body,
    });
}
exports.registerRecoveryModule = registerRecoveryModule;
/**
 * Delete email subscription for a single category
 * @param query
 */
function unsubscribeSingle(query) {
    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/subscriptions', { query });
}
exports.unsubscribeSingle = unsubscribeSingle;
/**
 * Delete email subscription for all categories
 * @param query
 */
function unsubscribeAll(query) {
    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/subscriptions/all', { query });
}
exports.unsubscribeAll = unsubscribeAll;
/**
 * Get Safe overviews per address
 */
function getSafeOverviews(safes, query) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/safes', {
        query: Object.assign(Object.assign({}, query), { safes: safes.join(',') }),
    });
}
exports.getSafeOverviews = getSafeOverviews;
function getContract(chainId, contractAddress) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/contracts/{contractAddress}', {
        path: {
            chainId: chainId,
            contractAddress: contractAddress,
        },
    });
}
exports.getContract = getContract;
function getAuthNonce() {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/auth/nonce', { credentials: 'include' });
}
exports.getAuthNonce = getAuthNonce;
function verifyAuth(body) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/auth/verify', {
        body,
        credentials: 'include',
    });
}
exports.verifyAuth = verifyAuth;
function createAccount(body) {
    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/accounts', {
        body,
        credentials: 'include',
    });
}
exports.createAccount = createAccount;
function getAccount(address) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/accounts/{address}', {
        path: { address },
        credentials: 'include',
    });
}
exports.getAccount = getAccount;
function deleteAccount(address) {
    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/accounts/{address}', {
        path: { address },
        credentials: 'include',
    });
}
exports.deleteAccount = deleteAccount;
function getAccountDataTypes() {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/accounts/data-types');
}
exports.getAccountDataTypes = getAccountDataTypes;
function getAccountDataSettings(address) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/accounts/{address}/data-settings', {
        path: { address },
        credentials: 'include',
    });
}
exports.getAccountDataSettings = getAccountDataSettings;
function putAccountDataSettings(address, body) {
    return (0, endpoint_1.putEndpoint)(baseUrl, '/v1/accounts/{address}/data-settings', {
        path: { address },
        body,
        credentials: 'include',
    });
}
exports.putAccountDataSettings = putAccountDataSettings;
function getIndexingStatus(chainId) {
    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/about/indexing', {
        path: { chainId },
    });
}
exports.getIndexingStatus = getIndexingStatus;
/* eslint-enable @typescript-eslint/explicit-module-boundary-types */
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 3950:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FEATURES = exports.GAS_PRICE_TYPE = exports.RPC_AUTHENTICATION = void 0;
var RPC_AUTHENTICATION;
(function (RPC_AUTHENTICATION) {
    RPC_AUTHENTICATION["API_KEY_PATH"] = "API_KEY_PATH";
    RPC_AUTHENTICATION["NO_AUTHENTICATION"] = "NO_AUTHENTICATION";
    RPC_AUTHENTICATION["UNKNOWN"] = "UNKNOWN";
})(RPC_AUTHENTICATION = exports.RPC_AUTHENTICATION || (exports.RPC_AUTHENTICATION = {}));
var GAS_PRICE_TYPE;
(function (GAS_PRICE_TYPE) {
    GAS_PRICE_TYPE["ORACLE"] = "ORACLE";
    GAS_PRICE_TYPE["FIXED"] = "FIXED";
    GAS_PRICE_TYPE["FIXED_1559"] = "FIXED1559";
    GAS_PRICE_TYPE["UNKNOWN"] = "UNKNOWN";
})(GAS_PRICE_TYPE = exports.GAS_PRICE_TYPE || (exports.GAS_PRICE_TYPE = {}));
var FEATURES;
(function (FEATURES) {
    FEATURES["ERC721"] = "ERC721";
    FEATURES["SAFE_APPS"] = "SAFE_APPS";
    FEATURES["CONTRACT_INTERACTION"] = "CONTRACT_INTERACTION";
    FEATURES["DOMAIN_LOOKUP"] = "DOMAIN_LOOKUP";
    FEATURES["SPENDING_LIMIT"] = "SPENDING_LIMIT";
    FEATURES["EIP1559"] = "EIP1559";
    FEATURES["SAFE_TX_GAS_OPTIONAL"] = "SAFE_TX_GAS_OPTIONAL";
    FEATURES["TX_SIMULATION"] = "TX_SIMULATION";
    FEATURES["EIP1271"] = "EIP1271";
})(FEATURES = exports.FEATURES || (exports.FEATURES = {}));
//# sourceMappingURL=chains.js.map

/***/ }),

/***/ 46143:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    TokenType["ERC20"] = "ERC20";
    TokenType["ERC721"] = "ERC721";
    TokenType["NATIVE_TOKEN"] = "NATIVE_TOKEN";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
//# sourceMappingURL=common.js.map

/***/ }),

/***/ 46257:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NativeStakingStatus = exports.ConfirmationViewTypes = void 0;
var ConfirmationViewTypes;
(function (ConfirmationViewTypes) {
    ConfirmationViewTypes["GENERIC"] = "GENERIC";
    ConfirmationViewTypes["COW_SWAP_ORDER"] = "COW_SWAP_ORDER";
    ConfirmationViewTypes["COW_SWAP_TWAP_ORDER"] = "COW_SWAP_TWAP_ORDER";
    ConfirmationViewTypes["KILN_NATIVE_STAKING_DEPOSIT"] = "KILN_NATIVE_STAKING_DEPOSIT";
    ConfirmationViewTypes["KILN_NATIVE_STAKING_VALIDATORS_EXIT"] = "KILN_NATIVE_STAKING_VALIDATORS_EXIT";
    ConfirmationViewTypes["KILN_NATIVE_STAKING_WITHDRAW"] = "KILN_NATIVE_STAKING_WITHDRAW";
})(ConfirmationViewTypes = exports.ConfirmationViewTypes || (exports.ConfirmationViewTypes = {}));
var NativeStakingStatus;
(function (NativeStakingStatus) {
    NativeStakingStatus["NOT_STAKED"] = "NOT_STAKED";
    NativeStakingStatus["ACTIVATING"] = "ACTIVATING";
    NativeStakingStatus["DEPOSIT_IN_PROGRESS"] = "DEPOSIT_IN_PROGRESS";
    NativeStakingStatus["ACTIVE"] = "ACTIVE";
    NativeStakingStatus["EXIT_REQUESTED"] = "EXIT_REQUESTED";
    NativeStakingStatus["EXITING"] = "EXITING";
    NativeStakingStatus["EXITED"] = "EXITED";
    NativeStakingStatus["SLASHED"] = "SLASHED";
})(NativeStakingStatus = exports.NativeStakingStatus || (exports.NativeStakingStatus = {}));
//# sourceMappingURL=decoded-data.js.map

/***/ }),

/***/ 33421:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=master-copies.js.map

/***/ }),

/***/ 92916:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeviceType = void 0;
var DeviceType;
(function (DeviceType) {
    DeviceType["ANDROID"] = "ANDROID";
    DeviceType["IOS"] = "IOS";
    DeviceType["WEB"] = "WEB";
})(DeviceType = exports.DeviceType || (exports.DeviceType = {}));
//# sourceMappingURL=notifications.js.map

/***/ }),

/***/ 87633:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=relay.js.map

/***/ }),

/***/ 85940:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SafeAppSocialPlatforms = exports.SafeAppFeatures = exports.SafeAppAccessPolicyTypes = void 0;
var SafeAppAccessPolicyTypes;
(function (SafeAppAccessPolicyTypes) {
    SafeAppAccessPolicyTypes["NoRestrictions"] = "NO_RESTRICTIONS";
    SafeAppAccessPolicyTypes["DomainAllowlist"] = "DOMAIN_ALLOWLIST";
})(SafeAppAccessPolicyTypes = exports.SafeAppAccessPolicyTypes || (exports.SafeAppAccessPolicyTypes = {}));
var SafeAppFeatures;
(function (SafeAppFeatures) {
    SafeAppFeatures["BATCHED_TRANSACTIONS"] = "BATCHED_TRANSACTIONS";
})(SafeAppFeatures = exports.SafeAppFeatures || (exports.SafeAppFeatures = {}));
var SafeAppSocialPlatforms;
(function (SafeAppSocialPlatforms) {
    SafeAppSocialPlatforms["TWITTER"] = "TWITTER";
    SafeAppSocialPlatforms["GITHUB"] = "GITHUB";
    SafeAppSocialPlatforms["DISCORD"] = "DISCORD";
})(SafeAppSocialPlatforms = exports.SafeAppSocialPlatforms || (exports.SafeAppSocialPlatforms = {}));
//# sourceMappingURL=safe-apps.js.map

/***/ }),

/***/ 40525:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ImplementationVersionState = void 0;
var ImplementationVersionState;
(function (ImplementationVersionState) {
    ImplementationVersionState["UP_TO_DATE"] = "UP_TO_DATE";
    ImplementationVersionState["OUTDATED"] = "OUTDATED";
    ImplementationVersionState["UNKNOWN"] = "UNKNOWN";
})(ImplementationVersionState = exports.ImplementationVersionState || (exports.ImplementationVersionState = {}));
//# sourceMappingURL=safe-info.js.map

/***/ }),

/***/ 89153:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SafeMessageStatus = exports.SafeMessageListItemType = void 0;
var SafeMessageListItemType;
(function (SafeMessageListItemType) {
    SafeMessageListItemType["DATE_LABEL"] = "DATE_LABEL";
    SafeMessageListItemType["MESSAGE"] = "MESSAGE";
})(SafeMessageListItemType = exports.SafeMessageListItemType || (exports.SafeMessageListItemType = {}));
var SafeMessageStatus;
(function (SafeMessageStatus) {
    SafeMessageStatus["NEEDS_CONFIRMATION"] = "NEEDS_CONFIRMATION";
    SafeMessageStatus["CONFIRMED"] = "CONFIRMED";
})(SafeMessageStatus = exports.SafeMessageStatus || (exports.SafeMessageStatus = {}));
//# sourceMappingURL=safe-messages.js.map

/***/ }),

/***/ 66136:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LabelValue = exports.StartTimeValue = exports.DurationType = exports.DetailedExecutionInfoType = exports.TransactionListItemType = exports.ConflictType = exports.TransactionInfoType = exports.SettingsInfoType = exports.TransactionTokenType = exports.TransferDirection = exports.TransactionStatus = exports.Operation = void 0;
var Operation;
(function (Operation) {
    Operation[Operation["CALL"] = 0] = "CALL";
    Operation[Operation["DELEGATE"] = 1] = "DELEGATE";
})(Operation = exports.Operation || (exports.Operation = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["AWAITING_CONFIRMATIONS"] = "AWAITING_CONFIRMATIONS";
    TransactionStatus["AWAITING_EXECUTION"] = "AWAITING_EXECUTION";
    TransactionStatus["CANCELLED"] = "CANCELLED";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["SUCCESS"] = "SUCCESS";
})(TransactionStatus = exports.TransactionStatus || (exports.TransactionStatus = {}));
var TransferDirection;
(function (TransferDirection) {
    TransferDirection["INCOMING"] = "INCOMING";
    TransferDirection["OUTGOING"] = "OUTGOING";
    TransferDirection["UNKNOWN"] = "UNKNOWN";
})(TransferDirection = exports.TransferDirection || (exports.TransferDirection = {}));
var TransactionTokenType;
(function (TransactionTokenType) {
    TransactionTokenType["ERC20"] = "ERC20";
    TransactionTokenType["ERC721"] = "ERC721";
    TransactionTokenType["NATIVE_COIN"] = "NATIVE_COIN";
})(TransactionTokenType = exports.TransactionTokenType || (exports.TransactionTokenType = {}));
var SettingsInfoType;
(function (SettingsInfoType) {
    SettingsInfoType["SET_FALLBACK_HANDLER"] = "SET_FALLBACK_HANDLER";
    SettingsInfoType["ADD_OWNER"] = "ADD_OWNER";
    SettingsInfoType["REMOVE_OWNER"] = "REMOVE_OWNER";
    SettingsInfoType["SWAP_OWNER"] = "SWAP_OWNER";
    SettingsInfoType["CHANGE_THRESHOLD"] = "CHANGE_THRESHOLD";
    SettingsInfoType["CHANGE_IMPLEMENTATION"] = "CHANGE_IMPLEMENTATION";
    SettingsInfoType["ENABLE_MODULE"] = "ENABLE_MODULE";
    SettingsInfoType["DISABLE_MODULE"] = "DISABLE_MODULE";
    SettingsInfoType["SET_GUARD"] = "SET_GUARD";
    SettingsInfoType["DELETE_GUARD"] = "DELETE_GUARD";
})(SettingsInfoType = exports.SettingsInfoType || (exports.SettingsInfoType = {}));
var TransactionInfoType;
(function (TransactionInfoType) {
    TransactionInfoType["TRANSFER"] = "Transfer";
    TransactionInfoType["SETTINGS_CHANGE"] = "SettingsChange";
    TransactionInfoType["CUSTOM"] = "Custom";
    TransactionInfoType["CREATION"] = "Creation";
    TransactionInfoType["SWAP_ORDER"] = "SwapOrder";
    TransactionInfoType["TWAP_ORDER"] = "TwapOrder";
    TransactionInfoType["SWAP_TRANSFER"] = "SwapTransfer";
    TransactionInfoType["NATIVE_STAKING_DEPOSIT"] = "NativeStakingDeposit";
    TransactionInfoType["NATIVE_STAKING_VALIDATORS_EXIT"] = "NativeStakingValidatorsExit";
    TransactionInfoType["NATIVE_STAKING_WITHDRAW"] = "NativeStakingWithdraw";
})(TransactionInfoType = exports.TransactionInfoType || (exports.TransactionInfoType = {}));
var ConflictType;
(function (ConflictType) {
    ConflictType["NONE"] = "None";
    ConflictType["HAS_NEXT"] = "HasNext";
    ConflictType["END"] = "End";
})(ConflictType = exports.ConflictType || (exports.ConflictType = {}));
var TransactionListItemType;
(function (TransactionListItemType) {
    TransactionListItemType["TRANSACTION"] = "TRANSACTION";
    TransactionListItemType["LABEL"] = "LABEL";
    TransactionListItemType["CONFLICT_HEADER"] = "CONFLICT_HEADER";
    TransactionListItemType["DATE_LABEL"] = "DATE_LABEL";
})(TransactionListItemType = exports.TransactionListItemType || (exports.TransactionListItemType = {}));
var DetailedExecutionInfoType;
(function (DetailedExecutionInfoType) {
    DetailedExecutionInfoType["MULTISIG"] = "MULTISIG";
    DetailedExecutionInfoType["MODULE"] = "MODULE";
})(DetailedExecutionInfoType = exports.DetailedExecutionInfoType || (exports.DetailedExecutionInfoType = {}));
var DurationType;
(function (DurationType) {
    DurationType["AUTO"] = "AUTO";
    DurationType["LIMIT_DURATION"] = "LIMIT_DURATION";
})(DurationType = exports.DurationType || (exports.DurationType = {}));
var StartTimeValue;
(function (StartTimeValue) {
    StartTimeValue["AT_MINING_TIME"] = "AT_MINING_TIME";
    StartTimeValue["AT_EPOCH"] = "AT_EPOCH";
})(StartTimeValue = exports.StartTimeValue || (exports.StartTimeValue = {}));
var LabelValue;
(function (LabelValue) {
    LabelValue["Queued"] = "Queued";
    LabelValue["Next"] = "Next";
})(LabelValue = exports.LabelValue || (exports.LabelValue = {}));
//# sourceMappingURL=transactions.js.map

/***/ }),

/***/ 90963:
/***/ (function(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getData = exports.fetchData = exports.stringifyQuery = exports.insertParams = void 0;
const isErrorResponse = (data) => {
    const isObject = typeof data === 'object' && data !== null;
    return isObject && 'code' in data && 'message' in data;
};
function replaceParam(str, key, value) {
    return str.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
}
function insertParams(template, params) {
    return params
        ? Object.keys(params).reduce((result, key) => {
            return replaceParam(result, key, String(params[key]));
        }, template)
        : template;
}
exports.insertParams = insertParams;
function stringifyQuery(query) {
    if (!query) {
        return '';
    }
    const searchParams = new URLSearchParams();
    Object.keys(query).forEach((key) => {
        if (query[key] != null) {
            searchParams.append(key, String(query[key]));
        }
    });
    const searchString = searchParams.toString();
    return searchString ? `?${searchString}` : '';
}
exports.stringifyQuery = stringifyQuery;
function parseResponse(resp) {
    return __awaiter(this, void 0, void 0, function* () {
        let json;
        try {
            json = yield resp.json();
        }
        catch (_a) {
            json = {};
        }
        if (!resp.ok) {
            const errTxt = isErrorResponse(json)
                ? `CGW error - ${json.code}: ${json.message}`
                : `CGW error - status ${resp.statusText}`;
            throw new Error(errTxt);
        }
        return json;
    });
}
function fetchData(url, method, body, headers, credentials) {
    return __awaiter(this, void 0, void 0, function* () {
        const requestHeaders = Object.assign({ 'Content-Type': 'application/json' }, headers);
        const options = {
            method: method !== null && method !== void 0 ? method : 'POST',
            headers: requestHeaders,
        };
        if (credentials) {
            options['credentials'] = credentials;
        }
        if (body != null) {
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
        const resp = yield fetch(url, options);
        return parseResponse(resp);
    });
}
exports.fetchData = fetchData;
function getData(url, headers, credentials) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            method: 'GET',
        };
        if (headers) {
            options['headers'] = Object.assign(Object.assign({}, headers), { 'Content-Type': 'application/json' });
        }
        if (credentials) {
            options['credentials'] = credentials;
        }
        const resp = yield fetch(url, options);
        return parseResponse(resp);
    });
}
exports.getData = getData;
//# sourceMappingURL=utils.js.map

/***/ })

}]);
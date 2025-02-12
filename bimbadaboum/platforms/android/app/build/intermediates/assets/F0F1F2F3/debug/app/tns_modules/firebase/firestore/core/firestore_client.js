/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FirestoreClient = undefined;

var _event_manager = require('./event_manager');

var _sync_engine = require('./sync_engine');

var _eager_garbage_collector = require('../local/eager_garbage_collector');

var _indexeddb_persistence = require('../local/indexeddb_persistence');

var _local_store = require('../local/local_store');

var _memory_persistence = require('../local/memory_persistence');

var _no_op_garbage_collector = require('../local/no_op_garbage_collector');

var _datastore = require('../remote/datastore');

var _remote_store = require('../remote/remote_store');

var _serializer = require('../remote/serializer');

var _error = require('../util/error');

var _log = require('../util/log');

var _promise = require('../util/promise');

var _promise2 = require('../../utils/promise');

/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var LOG_TAG = 'FirestoreClient';
/**
 * FirestoreClient is a top-level class that constructs and owns all of the
 * pieces of the client SDK architecture. It is responsible for creating the
 * async queue that is shared by all of the other components in the system.
 */
var FirestoreClient = /** @class */function () {
    function FirestoreClient(platform, databaseInfo, credentials,
    /**
       * Asynchronous queue responsible for all of our internal processing. When
       * we get incoming work from the user (via public API) or the network
       * (incoming GRPC messages), we should always schedule onto this queue.
       * This ensures all of our work is properly serialized (e.g. we don't
       * start processing a new operation while the previous one is waiting for
       * an async I/O to complete).
       */
    asyncQueue) {
        this.platform = platform;
        this.databaseInfo = databaseInfo;
        this.credentials = credentials;
        this.asyncQueue = asyncQueue;
    }
    /**
     * Starts up the FirestoreClient, returning only whether or not enabling
     * persistence succeeded.
     *
     * The intent here is to "do the right thing" as far as users are concerned.
     * Namely, in cases where offline persistence is requested and possible,
     * enable it, but otherwise fall back to persistence disabled. For the most
     * part we expect this to succeed one way or the other so we don't expect our
     * users to actually wait on the firestore.enablePersistence Promise since
     * they generally won't care.
     *
     * Of course some users actually do care about whether or not persistence
     * was successfully enabled, so the Promise returned from this method
     * indicates this outcome.
     *
     * This presents a problem though: even before enablePersistence resolves or
     * rejects, users may have made calls to e.g. firestore.collection() which
     * means that the FirestoreClient in there will be available and will be
     * enqueuing actions on the async queue.
     *
     * Meanwhile any failure of an operation on the async queue causes it to
     * panic and reject any further work, on the premise that unhandled errors
     * are fatal.
     *
     * Consequently the fallback is handled internally here in start, and if the
     * fallback succeeds we signal success to the async queue even though the
     * start() itself signals failure.
     *
     * @param usePersistence Whether or not to attempt to enable persistence.
     * @returns A deferred result indicating the user-visible result of enabling
     *     offline persistence. This method will reject this if IndexedDB fails to
     *     start for any reason. If usePersistence is false this is
     *     unconditionally resolved.
     */
    FirestoreClient.prototype.start = function (usePersistence) {
        var _this = this;
        // We defer our initialization until we get the current user from
        // setUserChangeListener(). We block the async queue until we got the
        // initial user and the initialization is completed. This will prevent
        // any scheduled work from happening before initialization is completed.
        //
        // If initializationDone resolved then the FirestoreClient is in a usable
        // state.
        var initializationDone = new _promise.Deferred();
        // If usePersistence is true, certain classes of errors while starting are
        // recoverable but only by falling back to persistence disabled.
        //
        // If there's an error in the first case but not in recovery we cannot
        // reject the promise blocking the async queue because this will cause the
        // async queue to panic.
        var persistenceResult = new _promise.Deferred();
        var initialized = false;
        this.credentials.setUserChangeListener(function (user) {
            if (!initialized) {
                initialized = true;
                _this.initializePersistence(usePersistence, persistenceResult).then(function () {
                    return _this.initializeRest(user);
                }).then(initializationDone.resolve, initializationDone.reject);
            } else {
                _this.asyncQueue.schedule(function () {
                    return _this.handleUserChange(user);
                });
            }
        });
        // Block the async queue until initialization is done
        this.asyncQueue.schedule(function () {
            return initializationDone.promise;
        });
        // Return only the result of enabling persistence. Note that this does not
        // need to await the completion of initializationDone because the result of
        // this method should not reflect any other kind of failure to start.
        return persistenceResult.promise;
    };
    /**
     * Initializes persistent storage, attempting to use IndexedDB if
     * usePersistence is true or memory-only if false.
     *
     * If IndexedDB fails because it's already open in another tab or because the
     * platform can't possibly support our implementation then this method rejects
     * the persistenceResult and falls back on memory-only persistence.
     *
     * @param usePersistence indicates whether or not to use offline persistence
     * @param persistenceResult A deferred result indicating the user-visible
     *     result of enabling offline persistence. This method will reject this if
     *     IndexedDB fails to start for any reason. If usePersistence is false
     *     this is unconditionally resolved.
     * @returns a Promise indicating whether or not initialization should
     *     continue, i.e. that one of the persistence implementations actually
     *     succeeded.
     */
    FirestoreClient.prototype.initializePersistence = function (usePersistence, persistenceResult) {
        var _this = this;
        if (usePersistence) {
            return this.startIndexedDbPersistence().then(persistenceResult.resolve).catch(function (error) {
                // Regardless of whether or not the retry succeeds, from an user
                // perspective, offline persistence has failed.
                persistenceResult.reject(error);
                // An unknown failure on the first stage shuts everything down.
                if (!_this.canFallback(error)) {
                    return _promise2.PromiseImpl.reject(error);
                }
                console.warn('Error enabling offline storage. Falling back to' + ' storage disabled: ' + error);
                return _this.startMemoryPersistence();
            });
        } else {
            // When usePersistence == false, enabling offline persistence is defined
            // to unconditionally succeed. This allows start() to have the same
            // signature for both cases, despite the fact that the returned promise
            // is only used in the enablePersistence call.
            persistenceResult.resolve();
            return this.startMemoryPersistence();
        }
    };
    FirestoreClient.prototype.canFallback = function (error) {
        return error.code === _error.Code.FAILED_PRECONDITION || error.code === _error.Code.UNIMPLEMENTED;
    };
    /**
     * Starts IndexedDB-based persistence.
     *
     * @returns A promise indicating success or failure.
     */
    FirestoreClient.prototype.startIndexedDbPersistence = function () {
        // TODO(http://b/33384523): For now we just disable garbage collection
        // when persistence is enabled.
        this.garbageCollector = new _no_op_garbage_collector.NoOpGarbageCollector();
        var storagePrefix = _indexeddb_persistence.IndexedDbPersistence.buildStoragePrefix(this.databaseInfo);
        // Opt to use proto3 JSON in case the platform doesn't support Uint8Array.
        var serializer = new _serializer.JsonProtoSerializer(this.databaseInfo.databaseId, {
            useProto3Json: true
        });
        this.persistence = new _indexeddb_persistence.IndexedDbPersistence(storagePrefix, serializer);
        return this.persistence.start();
    };
    /**
     * Starts Memory-backed persistence. In practice this cannot fail.
     *
     * @returns A promise that will successfully resolve.
     */
    FirestoreClient.prototype.startMemoryPersistence = function () {
        this.garbageCollector = new _eager_garbage_collector.EagerGarbageCollector();
        this.persistence = new _memory_persistence.MemoryPersistence();
        return this.persistence.start();
    };
    /**
     * Initializes the rest of the FirestoreClient, assuming the initial user
     * has been obtained from the credential provider and some persistence
     * implementation is available in this.persistence.
     */
    FirestoreClient.prototype.initializeRest = function (user) {
        var _this = this;
        return this.platform.loadConnection(this.databaseInfo).then(function (connection) {
            _this.localStore = new _local_store.LocalStore(_this.persistence, user, _this.garbageCollector);
            var serializer = _this.platform.newSerializer(_this.databaseInfo.databaseId);
            var datastore = new _datastore.Datastore(_this.databaseInfo, _this.asyncQueue, connection, _this.credentials, serializer);
            var onlineStateChangedHandler = function onlineStateChangedHandler(onlineState) {
                _this.eventMgr.onOnlineStateChanged(onlineState);
            };
            _this.remoteStore = new _remote_store.RemoteStore(_this.databaseInfo, _this.asyncQueue, _this.localStore, datastore, onlineStateChangedHandler);
            _this.syncEngine = new _sync_engine.SyncEngine(_this.localStore, _this.remoteStore, user);
            // Setup wiring between sync engine and remote store
            _this.remoteStore.syncEngine = _this.syncEngine;
            _this.eventMgr = new _event_manager.EventManager(_this.syncEngine);
            // NOTE: RemoteStore depends on LocalStore (for persisting stream
            // tokens, refilling mutation queue, etc.) so must be started after
            // LocalStore.
            return _this.localStore.start();
        }).then(function () {
            return _this.remoteStore.start();
        });
    };
    FirestoreClient.prototype.handleUserChange = function (user) {
        this.asyncQueue.verifyOperationInProgress();
        (0, _log.debug)(LOG_TAG, 'User Changed: ' + user.uid);
        return this.syncEngine.handleUserChange(user);
    };
    FirestoreClient.prototype.shutdown = function () {
        var _this = this;
        return this.asyncQueue.schedule(function () {
            _this.credentials.removeUserChangeListener();
            return _this.remoteStore.shutdown();
        }).then(function () {
            // PORTING NOTE: LocalStore does not need an explicit shutdown on web.
            return _this.persistence.shutdown();
        });
    };
    FirestoreClient.prototype.listen = function (query, observer, options) {
        var _this = this;
        var listener = new _event_manager.QueryListener(query, observer, options);
        this.asyncQueue.schedule(function () {
            return _this.eventMgr.listen(listener);
        });
        return listener;
    };
    FirestoreClient.prototype.unlisten = function (listener) {
        var _this = this;
        this.asyncQueue.schedule(function () {
            return _this.eventMgr.unlisten(listener);
        });
    };
    FirestoreClient.prototype.write = function (mutations) {
        var _this = this;
        var deferred = new _promise.Deferred();
        this.asyncQueue.schedule(function () {
            return _this.syncEngine.write(mutations, deferred);
        });
        return deferred.promise;
    };
    FirestoreClient.prototype.databaseId = function () {
        return this.databaseInfo.databaseId;
    };
    FirestoreClient.prototype.transaction = function (updateFunction) {
        var _this = this;
        // We have to wait for the async queue to be sure syncEngine is initialized.
        return this.asyncQueue.schedule(function () {
            return _promise2.PromiseImpl.resolve();
        }).then(function () {
            return _this.syncEngine.runTransaction(updateFunction);
        });
    };
    return FirestoreClient;
}();
exports.FirestoreClient = FirestoreClient;
//# sourceMappingURL=firestore_client.js.map

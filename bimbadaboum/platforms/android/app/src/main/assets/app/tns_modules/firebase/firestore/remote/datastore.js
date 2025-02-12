/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Datastore = undefined;

var _collections = require('../model/collections');

var _assert = require('../util/assert');

var _persistent_stream = require('./persistent_stream');

/**
 * Datastore is a wrapper around the external Google Cloud Datastore grpc API,
 * which provides an interface that is more convenient for the rest of the
 * client SDK architecture to consume.
 */
var Datastore = /** @class */function () {
    function Datastore(databaseInfo, queue, connection, credentials, serializer, initialBackoffDelay) {
        this.databaseInfo = databaseInfo;
        this.queue = queue;
        this.connection = connection;
        this.credentials = credentials;
        this.serializer = serializer;
        this.initialBackoffDelay = initialBackoffDelay;
    }
    Datastore.prototype.newPersistentWriteStream = function (listener) {
        return new _persistent_stream.PersistentWriteStream(this.databaseInfo, this.queue, this.connection, this.credentials, this.serializer, listener, this.initialBackoffDelay);
    };
    Datastore.prototype.newPersistentWatchStream = function (listener) {
        return new _persistent_stream.PersistentListenStream(this.databaseInfo, this.queue, this.connection, this.credentials, this.serializer, listener, this.initialBackoffDelay);
    };
    Datastore.prototype.commit = function (mutations) {
        var _this = this;
        var params = {
            writes: mutations.map(function (m) {
                return _this.serializer.toMutation(m);
            })
        };
        return this.invokeRPC('commit', params).then(function (response) {
            return _this.serializer.fromWriteResults(response.writeResults);
        });
    };
    Datastore.prototype.lookup = function (keys) {
        var _this = this;
        var params = {
            documents: keys.map(function (k) {
                return _this.serializer.toName(k);
            })
        };
        return this.invokeRPC('batchGet', params).then(function (response) {
            var docs = (0, _collections.maybeDocumentMap)();
            response.forEach(function (proto) {
                var doc = _this.serializer.fromMaybeDocument(proto);
                docs = docs.insert(doc.key, doc);
            });
            var result = [];
            keys.forEach(function (key) {
                var doc = docs.get(key);
                (0, _assert.assert)(!!doc, 'Missing entity in write response for ' + key);
                result.push(doc);
            });
            return result;
        });
    };
    /** Gets an auth token and invokes the provided RPC. */
    Datastore.prototype.invokeRPC = function (rpcName, request) {
        var _this = this;
        // TODO(mikelehen): Retry (with backoff) on token failures?
        return this.credentials.getToken( /*forceRefresh=*/false).then(function (token) {
            return _this.connection.invoke(rpcName, request, token);
        });
    };
    return Datastore;
}(); /**
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
exports.Datastore = Datastore;
//# sourceMappingURL=datastore.js.map

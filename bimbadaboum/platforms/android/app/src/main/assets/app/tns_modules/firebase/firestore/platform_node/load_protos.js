/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.loadProtosAsync = loadProtosAsync;
exports.loadProtos = loadProtos;

var _node_api = require('../util/node_api');

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
var dynamicRequire = require;
var protobufjs = dynamicRequire('protobufjs');
function loadProtosAsync() {
    return (0, _node_api.nodePromise)(function (callback) {
        loadProtos(callback);
    });
}
/**
 * Loads the protocol buffer definitions for the datastore. This is a thin
 * wrapper around protobufjs.loadProtoFile which knows the location of the
 * proto files.
 *
 * @param callback if specified, the load is performed asynchronously and
 *     the protos are supplied to the callback.
 * @returns the ProtoBuilder if the callback is unspecified.
 */
function loadProtos(callback) {
    var builder = protobufjs.newBuilder({
        // Beware that converting fields to camel case does not convert the tag
        // fields in oneof groups (!!!).
        convertFieldsToCamelCase: true
    });
    var root = __dirname + '/../proto';
    var firestoreProtoFile = {
        root: root,
        file: 'google/firestore/v1beta1/firestore.proto'
    };
    if (callback === undefined) {
        // Synchronous load
        return protobufjs.loadProtoFile(firestoreProtoFile, undefined, builder);
    } else {
        // Load the protos asynchronously
        protobufjs.loadProtoFile(firestoreProtoFile, callback, builder);
        // We are using the callback so no return value, but we need to explicitly
        // return undefined
        return undefined;
    }
}
//# sourceMappingURL=load_protos.js.map

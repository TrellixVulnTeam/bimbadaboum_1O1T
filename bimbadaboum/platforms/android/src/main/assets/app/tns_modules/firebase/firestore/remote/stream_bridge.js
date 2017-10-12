/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamBridge = undefined;

var _assert = require('../util/assert');

/**
 * Provides a simple helper class that implements the Stream interface to
 * bridge to other implementations that are streams but do not implement the
 * interface. The stream callbacks are invoked with the callOn... methods.
 */
var StreamBridge = /** @class */function () {
    function StreamBridge(args) {
        this.wrappedOnOpen = null;
        this.wrappedOnClose = null;
        this.wrappedOnMessage = null;
        this.sendFn = args.sendFn;
        this.closeFn = args.closeFn;
    }
    StreamBridge.prototype.onOpen = function (callback) {
        (0, _assert.assert)(!this.wrappedOnOpen, 'Called onOpen on stream twice!');
        this.wrappedOnOpen = callback;
    };
    StreamBridge.prototype.onClose = function (callback) {
        (0, _assert.assert)(!this.wrappedOnClose, 'Called onClose on stream twice!');
        this.wrappedOnClose = callback;
    };
    StreamBridge.prototype.onMessage = function (callback) {
        (0, _assert.assert)(!this.wrappedOnMessage, 'Called onMessage on stream twice!');
        this.wrappedOnMessage = callback;
    };
    StreamBridge.prototype.close = function () {
        this.closeFn();
    };
    StreamBridge.prototype.send = function (msg) {
        this.sendFn(msg);
    };
    StreamBridge.prototype.callOnOpen = function () {
        (0, _assert.assert)(this.wrappedOnOpen !== null, 'Cannot call onOpen because no callback ' + 'was set');
        this.wrappedOnOpen();
    };
    StreamBridge.prototype.callOnClose = function (err) {
        (0, _assert.assert)(this.wrappedOnClose !== null, 'Cannot call onClose because no ' + 'callback was set');
        this.wrappedOnClose(err);
    };
    StreamBridge.prototype.callOnMessage = function (msg) {
        (0, _assert.assert)(this.wrappedOnMessage !== null, 'Cannot call onMessage because no ' + 'callback was set');
        this.wrappedOnMessage(msg);
    };
    return StreamBridge;
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
exports.StreamBridge = StreamBridge;
//# sourceMappingURL=stream_bridge.js.map

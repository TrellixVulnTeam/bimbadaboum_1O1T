/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SnapshotVersion = undefined;

var _timestamp = require('./timestamp');

/**
 * A version of a document in Firestore. This corresponds to the version
 * timestamp, such as update_time or read_time.
 */
var SnapshotVersion = /** @class */function () {
    function SnapshotVersion(timestamp) {
        this.timestamp = timestamp;
    }
    // TODO(b/34176344): Once we no longer need to use the old alpha protos,
    // delete this constructor and use a timestamp-backed version everywhere.
    SnapshotVersion.fromMicroseconds = function (value) {
        var seconds = Math.floor(value / 1e6);
        var nanos = value % 1e6 * 1e3;
        return new SnapshotVersion(new _timestamp.Timestamp(seconds, nanos));
    };
    SnapshotVersion.fromTimestamp = function (value) {
        return new SnapshotVersion(value);
    };
    SnapshotVersion.forDeletedDoc = function () {
        return SnapshotVersion.MIN;
    };
    SnapshotVersion.prototype.compareTo = function (other) {
        return this.timestamp.compareTo(other.timestamp);
    };
    SnapshotVersion.prototype.equals = function (other) {
        return this.timestamp.equals(other.timestamp);
    };
    /** Returns a number representation of the version for use in spec tests. */
    SnapshotVersion.prototype.toMicroseconds = function () {
        // Convert to microseconds.
        return this.timestamp.seconds * 1e6 + this.timestamp.nanos / 1000;
    };
    SnapshotVersion.prototype.toString = function () {
        return 'SnapshotVersion(' + this.timestamp.toString() + ')';
    };
    SnapshotVersion.prototype.toTimestamp = function () {
        return this.timestamp;
    };
    SnapshotVersion.MIN = new SnapshotVersion(new _timestamp.Timestamp(0, 0));
    return SnapshotVersion;
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
exports.SnapshotVersion = SnapshotVersion;
//# sourceMappingURL=snapshot_version.js.map

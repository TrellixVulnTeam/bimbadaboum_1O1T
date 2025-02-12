/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
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
/**
 * Simple wrapper around a nullable UID. Mostly exists to make code more
 * readable.
 */
var User = /** @class */function () {
    function User(uid) {
        this.uid = uid;
    }
    User.prototype.isUnauthenticated = function () {
        return this.uid == null;
    };
    /**
     * Returns a key representing this user, suitable for inclusion in a
     * dictionary.
     */
    User.prototype.toKey = function () {
        if (this.isUnauthenticated()) {
            return 'anonymous-user';
        } else {
            return 'uid:' + this.uid;
        }
    };
    User.prototype.equals = function (otherUser) {
        return otherUser.uid === this.uid;
    };
    /** A user with a null UID. */
    User.UNAUTHENTICATED = new User(null);
    // TODO(mikelehen): Look into getting a proper uid-equivalent for
    // non-FirebaseAuth providers.
    User.GOOGLE_CREDENTIALS = new User('google-credentials-uid');
    User.FIRST_PARTY = new User('first-party-uid');
    return User;
}();
exports.User = User;
//# sourceMappingURL=user.js.map

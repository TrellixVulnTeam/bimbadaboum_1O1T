/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

var _config = require('../config');

if (typeof __firestore_exports__ !== 'undefined') {
    (0, _config.configureForStandalone)(__firestore_exports__);
} else {
    // Wrap in a closure to allow throwing from within a goog.module.
    // TS compiles this file to a goog.module which then disallows throwing
    // directly.
    (function () {
        throw new Error('__firestore_exports__ not found.');
    })();
} /**
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
//# sourceMappingURL=goog_module_config.js.map

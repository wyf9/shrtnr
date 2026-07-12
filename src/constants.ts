// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

export const MIN_SLUG_LENGTH = 3;
export const DEFAULT_SLUG_LENGTH = MIN_SLUG_LENGTH;

// Above this slug length the number of possible combinations becomes
// astronomically large and would overflow the settings hint area, so the UI
// shows an "infinite" label instead of the exact count.
export const SLUG_COMBO_INFINITE_THRESHOLD = 25;

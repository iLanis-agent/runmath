/* RunMath engine - running pace math, race prediction, split planning.
   Pure math, no DOM. Shared by app.html and the node test suite. */
(function (root) {
  'use strict';

  var MI_KM = 1.609344;
  var RIEGEL_EXP = 1.06; // Riegel's fatigue factor
  var STD_DISTANCES = [
    { label: '1500m', km: 1.5 },
    { label: 'Mile', km: MI_KM },
    { label: '5K', km: 5 },
    { label: '10K', km: 10 },
    { label: 'Half marathon', km: 21.0975 },
    { label: 'Marathon', km: 42.195 }
  ];

  // "5:30" or "50:00" or "1:50:19" or bare seconds. Returns seconds or null.
  function parseTime(str) {
    var s = String(str).trim();
    if (!s) return null;
    var parts = s.split(':');
    if (parts.length > 3) return null;
    var nums = [];
    for (var i = 0; i < parts.length; i++) {
      if (!/^\d+(\.\d+)?$/.test(parts[i])) return null;
      nums.push(parseFloat(parts[i]));
    }
    if (nums.length === 1) return nums[0];
    if (nums.length === 2) return nums[0] * 60 + nums[1];
    return nums[0] * 3600 + nums[1] * 60 + nums[2];
  }

  // Seconds -> "H:MM:SS" or "M:SS" (tenths dropped, rounded to whole second).
  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) return '-';
    var t = Math.round(sec);
    var h = Math.floor(t / 3600);
    var m = Math.floor((t % 3600) / 60);
    var s = t % 60;
    if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // Pace in seconds per km for a finish time over a distance in km.
  function paceSecPerKm(timeSec, distKm) {
    if (!(timeSec > 0) || !(distKm > 0)) return null;
    return timeSec / distKm;
  }

  function paceSecPerMile(timeSec, distKm) {
    var p = paceSecPerKm(timeSec, distKm);
    return p === null ? null : p * MI_KM;
  }

  function speedKmh(timeSec, distKm) {
    if (!(timeSec > 0) || !(distKm > 0)) return null;
    return distKm / (timeSec / 3600);
  }

  // Riegel: T2 = T1 * (D2/D1)^1.06
  function riegel(timeSec, fromKm, toKm, exp) {
    if (!(timeSec > 0) || !(fromKm > 0) || !(toKm > 0)) return null;
    var e = exp === undefined ? RIEGEL_EXP : exp;
    return timeSec * Math.pow(toKm / fromKm, e);
  }

  // Equivalent performances across the standard distance list.
  function equivalents(timeSec, fromKm) {
    return STD_DISTANCES.map(function (d) {
      return { label: d.label, km: d.km, time: riegel(timeSec, fromKm, d.km) };
    });
  }

  // Split plan: even, or negative/positive by pct (second half pct faster/slower).
  // mode: 'even' | 'negative' | 'positive'; pct e.g. 2 means 2%.
  // Returns {perKm: [sec,...], firstHalf, secondHalf} or null.
  function splitPlan(totalSec, distKm, mode, pct) {
    if (!(totalSec > 0) || !(distKm > 0)) return null;
    mode = mode || 'even';
    pct = pct || 0;
    var halves = distKm / 2;
    var firstHalf, secondHalf;
    if (mode === 'even' || pct <= 0) {
      firstHalf = totalSec / 2;
      secondHalf = totalSec / 2;
    } else if (mode === 'negative') {
      firstHalf = totalSec / (2 - pct / 100);
      secondHalf = totalSec - firstHalf;
    } else if (mode === 'positive') {
      firstHalf = totalSec / (2 + pct / 100);
      secondHalf = totalSec - firstHalf;
    } else {
      return null;
    }
    var avgFirst = firstHalf / halves;   // sec per km over first half
    var avgSecond = secondHalf / halves; // sec per km over second half
    var perKm = [];
    var n = Math.floor(distKm);
    for (var k = 0; k < n; k++) perKm.push(k < halves ? avgFirst : avgSecond);
    var rem = distKm - n;
    if (rem > 1e-9) perKm.push((n < halves ? avgFirst : avgSecond) * rem);
    return { perKm: perKm, firstHalf: firstHalf, secondHalf: secondHalf };
  }

  // How common is this performance? Honest bands for road-race finish times.
  function paceBand(secPerKm) {
    if (!(secPerKm > 0)) return null;
    if (secPerKm < 200) return 'sub-elite territory - most local podiums live here';
    if (secPerKm < 240) return 'fast amateur - top of most age-group results';
    if (secPerKm < 300) return 'strong club runner - comfortably top third';
    if (secPerKm < 360) return 'solid recreational runner - the honest middle';
    if (secPerKm < 420) return 'building the base - every run counts double here';
    return 'out the door and moving - the hardest pace there is';
  }

  var api = {
    MI_KM: MI_KM,
    RIEGEL_EXP: RIEGEL_EXP,
    STD_DISTANCES: STD_DISTANCES,
    parseTime: parseTime,
    fmtTime: fmtTime,
    paceSecPerKm: paceSecPerKm,
    paceSecPerMile: paceSecPerMile,
    speedKmh: speedKmh,
    riegel: riegel,
    equivalents: equivalents,
    splitPlan: splitPlan,
    paceBand: paceBand
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RunMath = api;
})(typeof window !== 'undefined' ? window : globalThis);

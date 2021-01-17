// Returns function that hashes a string to a number
// See https://stackoverflow.com/a/47593316
export function xmur3(str) {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
            h = h << 13 | h >>> 19;
    return function () {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

// Returns function that generates a random number every time it's called,
// based on the initial seed passed to this function.
// See https://stackoverflow.com/a/47593316
export function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Seeded random number generator
export function rand(seed) {
    seed = seed.toString();
    const hash = xmur3(seed);
    return mulberry32(hash());
}

export async function getCsv(filename, hasHeader) {
    return new Promise((resolve, reject) => {
        //Papa.parse(`data/${filename}.csv`, {
        Papa.parse(filename, {
            header: hasHeader,
            download: true,
            complete: function (results) {
                resolve(results.data);
            },
            error: function (err) {
                reject(err);
            }
        });
    });
}

// Prevents screen turning off. See: https://web.dev/wake-lock/
export async function wakeLock(timeoutSeconds = 5) {
    // Create a reference for the Wake Lock.
    let wakeLock = null;

    // create an async function to request a wake lock
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active!');
    } catch (err) {
        // The Wake Lock request has failed - usually system related, such as battery.
        console.log(`${err.name}, ${err.message}`);
    }

    // …and release it again after timeout seconds.
    window.setTimeout(() => {
        wakeLock.release()
            .then(() => {
                wakeLock = null;
            });
        console.log('Wake Lock released');
    }, timeoutSeconds * 1000);
}
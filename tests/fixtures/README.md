# Test fixture

The end-to-end tests decode one real HEIC photo. That file is not committed,
because a real iPhone photo carries camera and GPS metadata and this repository
is public.

To run `npm run test:e2e`, put a HEIC photo at:

```
tests/fixtures/heic_test.heic
```

The tests read this exact path and do not depend on the photo's content, so any
`.HEIC` file exported from an iPhone (or converted from another camera) works.
Every file in this folder matching `*.heic` is ignored by Git.

If no fixture is present, the unit tests still pass:

```bash
npm test
```

You can verify the fixture once before running the suite:

```bash
node -e "const b=require('fs').readFileSync('tests/fixtures/heic_test.heic');console.log(b.length, b.subarray(4,12).toString())"
```

A healthy fixture reports the `ftyp` brand at bytes 4–12 and a size of a few
hundred kilobytes to several megabytes.

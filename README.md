```
# run SSR with the react patch applied. this should work
pnpm run start

# run SSR without the react patch applied. this will crash,
# because RSDW will try to use a promise as an exports object, and get `undefined`.
pnpm run start-no-patch
```

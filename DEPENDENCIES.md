# Dependency notes

This document lists the reasons why specific dependencies are pinned down to
exact versions. Make sure to consider these points before updating dependencies
to their latest versions.

## `p-timeout`

`p-timeout==7.0.0` started throwing weird errors during the connection to the
server via a TCP socket. Version 6.1.4 seems to be okay, and the issue
probably has to do something with Electron _and_ the modifications in this
commit:

https://github.com/sindresorhus/p-timeout/commit/234f6428dabd228116a31a146c725eb2c1f5ab63

We should stick to 6.1.4 until this is sorted out, _or_ maybe refactor our code
to use an `AbortSignal` instead where possible.

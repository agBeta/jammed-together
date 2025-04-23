# Other tasks

## Redis (Valkey ?)

Why you should enable memory overcommit for Redis? 

(based on [medium](https://medium.com/@akhshyganesh/redis-enabling-memory-overcommit-is-a-crucial-configuration-68dbb77dae5f))

- Avoid Unnecessary Failures: Without memory overcommit, Redis might fail **even when there’s still plenty of virtual memory available**. This is because the operating system won’t allocate memory to Redis if it thinks it might run out later, even though Redis may not actually use that much memory.

### Installing

see:
- [valkey installation](https://valkey.io/topics/installation/).

- By default, Valkey **does not** require any authentication and listens to all the network interfaces. This is a big security issue. Checkout [security](https://valkey.io/topics/security/).

</br>

## Disk Management

_watch._

## Log rotation

_watch._

see also [rotating logs on linux (mariadb)](https://mariadb.com/kb/en/rotating-logs-on-unix-and-linux/)

## Server Updates

i.e. `apt` updates.   
_watch._

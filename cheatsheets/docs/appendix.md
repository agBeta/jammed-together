# Appendix

This file is merely useful to be referenced from other files and contains some fundamentals.

---

## User Management

- `/etc/passwd` essential information to users; each user identifier by a user-id (UID).

- actual passwords are stored by their hash in `/etc/shadow`.

- each user has a primary group and secondary group.

## Groups

Groups are all about simplifying permission management.   
stored in `/etc/group` file.

```sh
sudo groupadd finance-team

# add user1 to finance-team
sudo usermod -aG finance-team user1

sudo groupdel finance-team
```

## File Permissions

```sh
# o stands for others
chmod o+x file1

# remove write permission from the group
chmod g-w file2

# rwx for owner, r-x for group, r-x for others
chmod 755 file3
```

```sh
chmod u+s file1

# prevent users from deleting files they don't own inside a directory, even if they have write access
chmod +t directory-test2
```

### Ownership

to change the ownership of a file:

```sh
# owner user of a file
sudo chown user2 file1

# owner group of a file
sudo chgrp finance-team file1
```

## Sudo

Never use root user as your regular user; if the password leaks, you'll be in trouble.  
This is the whole idea behind using `sudo`, which allows a user to execute a command (or **some specific** commands) with root privileges without 
needing to login as the root user.

The `/etc/sudoers` file defines which users and groups have sudo access (for which commands). To avoid syntax errors, use `visudo` command to 
open this file.

You would see a line like this:
```sh
root  ALL=(ALL:ALL)  ALL
       1    2   3     4
```

What does this means?

- `root` is the name of the user.
- 1st means: the user can use `sudo` for any (=`ALL`) host.
- 2nd means: can run a command as any (=`ALL`) user.
- 3rd means: can run a command as any (=`ALL`) group.
- 4th means: the user can execute any (=`ALL`) command.


---

### High Performance Linux server

If you're going the route of high performance typically you'll want to run as few other (scheduled) processes as possible as they'll 
interfere with your application.

Linux, like the classical UNIX operating systems, is designed to run multiple applications concurrently in a fair way and 
tries to prevent resource starvation and you'll be aiming for the opposite, starve everything else except your application. 
Simple steps at the OS level are changing the nice level and real time priority of 
your application, changing the scheduler or going for a real-time kernel. ([SO](https://serverfault.com/a/623794))

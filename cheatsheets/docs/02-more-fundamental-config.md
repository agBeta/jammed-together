# VPS (Optimize)

## Timezone

First ssh into the server.

```sh
sudo timedatectl 

# find your timezone
sudo timedatectl list-timezones

# 🔶 see Note 2
sudo timedatectl set-timezone Europe/Paris

# confirm the last command worked
sudo timedatectl 

# other commands (though, why would you use them? daylight saving change?)
# 🔶 see Note 2
timedatectl set-time 15:58:30
timedatectl set-time 20151120 

date
```

(Note 1)  
Never change _Hardware_ clock (also called **RTC**). let it remain UTC. Anyway, the command to change hardware clock is `timedatectl set-local-rtc 1` but... **just DON'T**. (here 1 means use the local time for hardware clock).

(Note 2)  
If you set RTC to be in local time (though why would you do that?!), then `set-timezone` **will also update the RTC time**. Also `set-time` **will _always_** update the RTC time accordingly, **no matter** RTC is in local or not. ([timedatectl docs](https://www.freedesktop.org/software/systemd/man/latest/timedatectl.html#set-time%20%5BTIME%5D))

For timezone, typically you have three choices: UTC vs timezone of server location vs timezone of base HQ. Here are some points, _though most of them may be irrelevant in some contexts_ (e.g. if we have only one server) but the points are still insightful ([source](https://serverfault.com/questions/14685/local-timezones-on-servers-considered-harmful)):

- Daylight savings rules change, and updates do not always happen in a timely fashion. UTC makes this go away.
- When logs from servers in different location need to be compared, UTC makes a great common standard.

### NTP

You can tell the server to sync its time using other remote computers. This is called NTP (Network Time Protocol). you can enable it by `timedatectl set-ntp true`. To check whether the server is using NTP or not, run `timedatectl status`. you'll see a line 'NTP service'.  

Of course, the server needs special configuration and packages so that it can sync its time using NTP. A fresh VPS instance usually has this already configured, so you don't have to touch anything. But for sake of theory: There are at least 3 different popular packages/tools for NTP: `ntpd`, `chronyd`, `systemd-timesyncd`. The third one is lightweight and usually is the default. 

Check if systemd-timesyncd is being used fo NTP, by running `ls -lash /var/lib/systemd/timesync/clock`. The modification time ("mtime") of this file is updated on each successful NTP synchronization. ([systemd-timesyncd docs](https://www.freedesktop.org/software/systemd/man/latest/systemd-timesyncd.service.html#))

You can see config in `cat /etc/systemd/timesyncd.conf`. [`SaveIntervalSec`](https://www.freedesktop.org/software/systemd/man/latest/timesyncd.conf.html#SaveIntervalSec=) is probably the most important option. Anyway, won't touch it.

</br>


## Swap

Swap prevents crashes due to RAM extorsion. Swap partitions are often absent on a VPS. Note, frequent swapping leads to sluggish server behavior.

btw, see: 
- [why do I need swap? (SwapFaq)](https://help.ubuntu.com/community/SwapFaq)
- [swap file vs swap partition](https://askubuntu.com/a/1475802).

Even if the server has lots of RAM, a small to moderate amount of swap space will increase overall server stability.

**swappiness** is a value between 0-100. swappiness=0 tells the kernel to avoid swapping processes out of physical memory for as long as possible. Also note, Ubuntu **server** installations have different performance requirements to **desktop** systems, and the default value of 60 is likely more suitable ([ubuntu](https://help.ubuntu.com/community/SwapFaq)).


> <span style="color: dodgerblue;">**IMPORTANT**</span>  
>  **Mariadb crashes** if too much swapping occurs^. So if the mariadb keeps crashing, it means you need to buy more RAM (i.e. swapping cannot help you).  
(^): both 'Nginx Perfect Server' and 'Mariadb Administration' course warned this. The later course did not even create any swap file or swap partition. Also [mariadb docs](https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/configuring-mariadb/mariadb-performance-advanced-configurations/configuring-swappiness) says the same.  

> For **Valkey**, swap **must be enabled** and that your swap file size is equal to amount of memory on your system. (based on [valkey admin](https://valkey.io/topics/admin/)) 

_So, apparently you cannot install Valkey & Mariadb on the same server._

Understand, The lower value for swappiness, means the system will use memory more aggressively (instead of swapping to disk). The kernel will keep more data in RAM, reducing disk access (P.S.1). By keeping more in RAM, there is more space for **VFS cache** to store frequently used directories & information.  
You may also see [swappiness section](#swappiness).

P.S.1: see 'Optimizing memory usage' in [SwapFaq](https://help.ubuntu.com/community/SwapFaq).


#### Check swap

We use swap file (instead of swap partition).  
First, we need to check if the server has a swap space already configured (by hosting provider).

```sh
sudo swapon -s
# if already enabled, you will the Filename & Size. 
# Note, the 'Type' should be 'file'. If it is 'partition' then consult your hosts documentation.

# Alternatively
htop
# see 'Swp'. if swapping is disabled, you should see 0K/0K.
```

#### Remove swapfile

```sh
sudo swapoff <path-to-swapfile>
# path-to-swapfile is found from `swapon`.

# prevent swapfile from being activated at bootup
cd /etc/
# first create a backup copy (P.S.2):
sudo cp fstab fstab.bak

sudo nano fstab
```

Remove the directive for swapfile (contains `swap` keyword).

P.S.2: in case you want to restore, run `sudo cp fstab.bak fstab`.

Now you can safely delete the swapfile:
```sh
cd / 
# Note, the directory where swapfile exists might differ for you.

sudo rm swapfile

sudo swapon -s
# should output empty

sudo reboot
```

#### Create swapfile

```sh
# 🔶 command below take a few seconds. **DO NOT kill it**.
sudo dd if=/dev/zero of=/swapfile bs=1024 count=2097152
# 2097152 = 2 GB (RAM) * 1024 * 1024. it means a 2GB swapfile.

cd /
# disable read/write from other users/groups
sudo chmod 600 swapfile
ls -l

# format the swapfile as a linux swap area
sudo mkswap /swapfile

# activate swap
sudo swapon /swapfile

# verify
sudo swapon -s

# we MUST make the change permanent
cd /etc
sudo cp fstab fstab.bak
sudo nano fstab
```

Add the following at the end:
```sh
# ['Nginx perfect' course says ->] /swapfile  swap  swap  defaults  0  0

# ... but based on https://askubuntu.com/a/126049 and also fstab of our cloud provider, the correct format is:
/swapfile    none    swap    sw    0   0
```

Now **reboot the server**. Check if swap is enabled by `sudo swapon -s` or `htop`.

BTW, you could (but why would you?) create swapfile in any directory, i.e. not necessarily `/swapfile`, using the following: 

```sh
# reserve 1G swapfile (create swapfile in the current directory)
sudo fallocate -l 1G ./swapfile

# tell the kernel to use the reserved swapfile as Swap space
sudo mkswap swapfile 

# enabling swapping
sudo swapon swapfile
```


</br>

### Swappiness

First see all kernel parameters of the server.

```sh
sudo sysctl -a
```

Find `vm.swappiness` value (default is 60). Also find `vm.vfs_cache_pressure`.

Change these values using an **override file**. Note, config files in `sysctl.d` modify kernel parameters **at runtime**.

```sh
cd /etc/sysctl.d

ls 
# do NOT remove or edit any of existing content in this directory

sudo nano custom_overrides.conf
```

Now inside the file:
```sh
# SWAPPINESS AND CACHE PRESSURE
vm.swappiness = 1
vm.vfs_cache_pressure = 50
```

Save. then **reboot the server**. Verify recent changes are enabled (via `sudo sysctl -a`).

BTW, based on [this gist](https://gist.github.com/Nihhaar/ca550c221f3c87459ab383408a9c3928):

- `vfs_cache_pressure` this variable controls the tendency of the kernel to reclaim the memory which is used for caching of VFS caches, versus pagecache and swap. Increasing this value increases the rate at which VFS caches are reclaimed.

- You can check current values with:
    ```sh
    sudo cat /proc/sys/vm/swappiness
    sudo cat /proc/sys/vm/vfs_cache_pressure
    ```


</br>

## Shared Memory

Harden the shared memory:

```sh
cd /etc
sudo nano fstab
```

Add the following three parameters at the _end_:

```sh
...

# HARDEN SHARED MEMORY
none /dev/shm tmpfs defaults,noexec,nosuid,nodev 0 0
```

Save. then **reboot the server**. Verify via `mount | grep shm`.

`noexec` prevents execution of binaries.  
In linux, `suid` and `sgid`  (set user id and set group-id) are special permissions that change how files are executed. Read more in [Special permission explained](https://www.redhat.com/en/blog/suid-sgid-sticky-bit). So `nosuid` prevents them.

</br>

## IPv6

IPv6 complicates network administration. Also introduces new attack vectors. Some tools are **NOT ipv6-aware**. Moreover, if your infrastructure is not optimized for ipv6, it can lead to increased latency.

First, check if ipv6 is enabled or not. If the command does not print anything, it means ipv6 is disabled.

```sh
ip a | grep inet6
```

To disable ipv6, we can edit grub config file directly.  
**Side Note**: comments in [this SO](https://askubuntu.com/a/337736) recommend using an override file.


```sh
cd /etc/default
sudo nano grub
```

Find `GRUB_CMDLINE_LINUX`. Edit as the following:
```
...
GRUB_CMDLINE_LINUX="ipv6.disable=1"
```

Note, you may set `GRUB_CMDLINE_LINUX_DEFAULT="ipv6.disable=1 quiet splash"` to disable all traces of ipv6 completely. ([SO](https://askubuntu.com/a/337736))

Save. Then:

```sh
sudo update-grub
sudo reboot

# verify
ip a | grep inet6
```


</br>

## Network layer

_lesson 15, min 13_

Things we can do for optimization:
- increase maximum number of requests queued to a listened socket
- increase default and send/receive buffers for packets
- etc.

Things we can do for hardening:
- prevent SYN flood
- protect against IP Spoofing
- etc.

```sh
cd /etc/sysctl.d

sudo nano custom_overrides.conf
```

Add these lines at the end (after cache pressure that are already added):

> <span style="color: brown;">**\[WARNING\]**</span>  
> Some of these settings **may^** conflict with the way network is setup inside your hosting provider's datacenter.  
> For example `rp_filter=2` (i.e. loose mode) is recommended if using asymmetric routing or other complicated routing. ([here](https://sysctl-explorer.net/net/ipv4/rp_filter/))

> <span style="color: dodgerblue;">**\[IMPORTANT\]**</span>  
> The following values **may^** not be suitable for your workload. They are merely recommendations of 'Nginx Perfect Server' course.  
> For example, a sane value for `tcp_max_syn_backlog` depends on the number of concurrent connections you expect to handle. Whether you use Nginx as reverse proxy (or HAProxy, etc) plays a role. ([here](https://serverfault.com/a/953908))

(^) '_may_' does NOT mean these settings are necessarily bad.


```sh
# IP SPOOFING
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.rp_filter = 1
# SYN FLOOD
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5
# SOURCE PACKET ROUTING
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0
# (OPTIMIZE) Increase number of usable ports:
net.ipv4.ip_local_port_range = 1024 65535
# (OPTIMIZE) Increase size of file handles: (file-max is correct; NOT file_max)
# 2097152 = 256 kilobytes (allowed PER PROCESS)
fs.file-max = 2097152
# (OPTIMIZE & HARDENING) restrict core dumps
fs.suid_dumpable = 0 
# (OPTIMIZE) Change the number of incoming connections & incoming connections backlog (i.e. number of queued connections):
net.core.somaxconn = 65535
# maximum number of packets queued before being dropped. A higher value will handle traffic bursts.
net.core.netdev_max_backlog = 262144
# (OPTIMIZE) Increase the maximum amount of memory buffers (see third below):
# 25165824 = 24 megabits = 3 megabytes
net.core.optmem_max = 25165824 
# (OPTIMIZE) Increase the default and maximum send/receive buffers:
# 31457280 = 30 megabits = 3.75 megabytes
net.core.rmem_default = 31457280
# 67108864 = 64 megabits = 8 megabytes
net.core.rmem_max = 67108864
net.core.wmem_default = 31457280
net.core.wmem_max = 67108864
```

Save. then **reboot the server**.

For explanation of `ipv4` values see [ubuntu manpage](https://manpages.ubuntu.com/manpages/bionic/man7/tcp.7.html).

For `file-max`, verify the changes by `ulimit -n`. If the changes did not work, you may need to change `/etc/security/limits.conf` too (based on [this SO](https://askubuntu.com/a/1301845)).

For `optmem_max` (based on [this SO](https://stackoverflow.com/questions/47723793/in-linux-how-do-i-determine-optimal-value-of-optmem-max)):
- a kernel option that affects the memory allocated to the cmsg list maintained by the kernel that contains **extra** packet information. (**not** a part of the socket payload.)

- Why is it so low by default in most Linux distros if making it bigger improves performance? Most distributions have **normal users in mind** and most normal users, even if using Linux/Unix as a server, do not have a farm of servers that have fiber channels between them or server processes that don't need GB of IPC transfer.

In linux, sockets are files. you may see also [open file limits](#open-file-limits) section. 

</br>

## BBR

To enable Bottleneck Bandwidth & RTT (BBR) algorithm, first list of available congestion control algorithms on the server.

```sh
sudo sysctl net.ipv4.tcp_available_congestion_control

# check which is currently enabled
sudo sysctl net.ipv4.tcp_congestion_control
```

If it is not bbr, follow these steps to activate BBR (based on Q&A file):

```sh
sudo modprobe tcp_bbr
# P.S.3

sudo bash -c 'echo "tcp_bbr" > /etc/modules-load.d/bbr.conf'
sudo sysctl net.ipv4.tcp_available_congestion_control

sudo nano /etc/sysctl.d/custom_overrides.conf
```
Add the following lines:

```sh
...
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
```

Save. then **reboot the server**.

P.S.3: For modules & `modprobe` see [Loadable modules (ubuntu)](https://help.ubuntu.com/community/Loadable_Modules).

</br>

## Filesystem

### File Access Time (`noatime`)

Filesystem keeps track of the last time a file is accessed or read. We disable file access times. This may lead to significant performance improvement on **often-accessed** and **frequently-changing** files.  
(not sure whether this will improve a nodejs api server)

> <span style="color: brown;">**WARNING**</span>  
> Incorrectly modifying `fstab` file can lead to your server not being able to boot.

```sh
# determine storage drive
df -h
# make note of 'Filesystem' column of your storage drive.

# see the default parameters of this storage device when the server is booted
sudo cat /proc/mounts
# Find the corresponding row based on 'Filesystem' column of `df` command.
```

_This section is discontinued. Watch the video._



## Open file limits

```sh
# hard limit:
ulimit -Hn
# soft limit:
ulimit -Sn

cd /ect/security
```

The default open file limits is set in `limits.conf`. We add an **override file** to modify it.

```
cd limits.d
sudo nano custom_directives.conf
```

Write the following lines (copy & paste):

```sh
#<domain>   <type>  <item>      <value>
    *       soft    nofile      120000
    *       hard    nofile      120000
    root    soft    nofile      120000
    root    hard    nofile      120000
```

Some Notes:

- Hard limits are enforced "here and now", i.e. process can never access a resource if it would cause violation of a hard limit. A process _can exceed soft limit for a period of time_. Soft limit can be raised by a non-root user up to the hard limit. (comment in [SO](https://serverfault.com/questions/265155/soft-limit-vs-hard-limit))

- You can also set other security measurements, like `maxlogin`, etc. But we don't do it now. see default comments in `limits.conf` file for more info.

- comments in `limits.conf` file explicitly state:  
a <strong>user specific</strong> setting here can be overridden only with a user specific setting in the `limits.d` subdirectory.  
This means **if `limits.conf` contains settings for `root` (i.e. `root` under `<domain>` column)**, and you want to change defaults for root user, then you MUST have `root` under `<domain>` inside your custom override file (in `limits.d`). In other words, the following `*   hard   nofile  1000` in some **override** file **will NOT** not override settings for root. Again, just to reiterate, we assumed `root` has some default settings in `limits.conf`.

Save. then **reboot the server**. Verify the limits again via `ulimit`.

BTW, in order to see **max number** of open files (not ~~currently opened~~) like mariadb-server, etc. see [this link](https://www.cyberciti.biz/faq/viewing-open-file-limit-for-linux-process/). basically:

```sh
pgrep mariadbd
# it will print all processes having mariadbd in their name

# alternatively, you can use pidof. here we use for sshd.
pidof sshd
```

Assuming the previous command returned 3083. then:

```sh
cd /proc/3083
cat limits
```

If you want to see <span style="color: blue">current number</span> of open files on the OS (e.g. when server is under high load), use:

```sh
cat /proc/sys/fs/file-nr
# 40096   0       65536
```

It means this server has 40096 out of max 65536 open files.

</br>

---

### PAM

Linux-PAM (Pluggable Authentication Modules) is a system of libraries that handle the authentication tasks of applications (services) on the system. (based on [noble manpage](https://manpages.ubuntu.com/manpages/noble/man7/pam.7.html)).

 The principal feature of the PAM approach is that the system administrator is free to choose how individual service-providing applications will authenticate users.

 ```sh
cd /etc/pam.d
sudo nano common-session
 ```

Add `session required	pam_limits.so` at the end. Save & exit.

This will apply resource limits (already set in `/etc/security/`) to a user in a session.

Now open `common-session-noninteractive` and paste the same directive at the end.

Now, **reboot the server**.


### For each component

We need to set the open file limits separately for nginx and mariadb. We need to check the default open file limit for each component. But we have not installed them yet. Continue once you installed nginx and mariadb.

# Linux

\[other things\]:

- `timedatectl`

## Init

SysV Init vs systemd. Modern linux distros use systemd. Anyway, if you want to see init process, go to `/etc/init.d/`.

The command for systemd to switch to text-mode:

```sh
systemctl get-default
# should print graphical.target

sudo systemctl set-default multi-user.target
reboot
```

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
This is the whole idea behind using `sudo`, which allows a user to execute a command (or **some specific** commands) with root privileges without needing to login as the root user.

The `/etc/sudoers` file defines which users and groups have sudo access (for which commands). To avoid syntax errors, use `visudo` command to open this file.

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

</br>

## FileSystem

```sh
sudo fdisk -l

lsblk
```

How to partition a hard drive?

```sh
sudo fdisk /dev/sdb

# type m for help

# we want 'n': add a new partition

# ... (watch the video 22. Partitions in Linux Managing Disks)

lsblk
# the sdb1 partition should be in the list
```

Now, we need to format the partition:

```sh
sudo mkfs.ext4 /dev/sdb1
```

Now, we need to mount the partition use the following commands.   
According to [linuxquestions](https://www.linuxquestions.org/questions/linux-newbie-8/meaning-of-mounting-a-partition-4175647631), technically that you don't actually mount a partition; You mount a _filesystem_ located on that partition.

**What does mounting mean**? in terms of the Linux/UNIX context; it means to "attach" it to the file system hierarchy, so the files and folders within can be accessible to the system.

```sh
sudo mount /dev/sdb1 /mnt

# to verify:
mount
```

```sh
cd /mnt
sudo touch file1
sudo touch file2
sudo mkdir dir1
```

Now, to unmount:
```sh
sudo umount /mnt
```

Note, at the moment this mount is **not persisted** between reboots. The files will be preserved inside the physical hard drive, but the hard drive will not be automatically mounted after reboot; meaning if you `ls /mnt`, you won't see the files. 

### fstab

In order to persist mounts, we need to edit `/etc/fstab` file. Open the file via `sudo nano /etc/fstab`. Add the following:

```sh
...

/dev/sdb1       /mnt    ext4    defaults    0 0
# first 0 means disable backup
# second 0 means disable checking at the boot time
```

</br>

### FHS (Filesystem Hierarchy Standard)

_watch video 25_.


### Swap

_btw see also VPS '02-more-fundamental-config.md' # Swap section._

```sh
mkdir swap-test
# reserve 1G swapfile (create swapfile in the current directory)
sudo fallocate -l 1G ./swapfile

# tell the kernel to use the reserved swapfile as Swap space
sudo mkswap swapfile 

# enabling swapping
sudo swapon swapfile
```

### Monitoring & Troubleshooting

```sh
# show overall disk space usage (for each mount)
df -h

# show size of /var/log directory on disk
sudo du -sh /var/log

# first make sure /dev/sdb1 is unmounted.
sudo fsck /dev/sdb1
# it may takes minutes for a large disk
```

### LVM

PV(s): physical volumes  
VG(s): Volume Groups  
LV(s): Logical Volumes

```sh
sudo apt install lvm2

# assuming /dev/sdc1 exists (see a few sections above)
sudo pvcreate /dev/sdc1

sudo vgcreate vg_1 /dev/sdc1

# to verify:
sudo pvdisplay
sudo vgdisplay

# to create logical volume
sudo lvcreate -L 2G -n lv_1 vg_1

sudo vgdisplay
# 'Alloc PE' should be 2.00 GiB
```

Now we've create the logical volume, we need to format it (e.g. ext4):

```sh
sudo mkfs.ext4 /dev/vg_1/lv_1

# now mount it; e.g. to /mnt (which is the conventional directory for temporary mounts)
sudo mount /dev/vg_1/lv_1 /mnt

# to verify:
mount
```

Now imagine you want to extend the size of your disk without downtime. You can easily extend vg_1:

```sh
# assuming another psychical hard drive /dev/sdd1 partitions exists
sudo pvcreate /dev/sdd1

# add to the current 'vg_1' volume group:
sudo vgextend vg_1 /dev/sdd1

sudo vgdisplay
# 'VG Size' should be larger than before; also 'Free PE'.

# let's extends lv_1
sudo lvextend -L +8G /dev/vg_1/lv_1

# now we MUST expand the filesystem to utilize this new space:
sudo resize2fs /dev/vg_1/lv_1
```

> <span style="color: brown;">**IMPORTANT**</span>  
>  It is highly recommended to backup your data before extending/etc. Also make sure you add extra disk space before the disk becomes full.


## Process

```sh
sudo journalctl -u nginx

# view system calls for a specific process
strace -p <PID>

# list open files and network connections
lsof -p <PID>
```

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


---

### High Performance Linux server

If you're going the route of high performance typically you'll want to run as few other (scheduled) processes as possible as they'll interfere with your application.

Linux, like the classical UNIX operating systems, is designed to run multiple applications concurrently in a fair way and tries to prevent resource starvation and you'll be aiming for the opposite, starve everything else except your application. Simple steps at the OS level are changing the nice level and real time priority of your application, changing the scheduler or going for a real-time kernel. ([SO](https://serverfault.com/a/623794))

</br>

---

## Disk Management

### Theory

#### mount & unmount

مفهوم Mount کردن به معنای اتصال یک دستگاه ذخیره‌سازی (مانند دیسک سخت، پارتیشن یا درایو USB) به سیستم فایل لینوکس است. وقتی یک دیسک یا پارتیشن را mount می‌کنید، سیستم عامل آن را در دایرکتوری خاصی (که به آن "mount point" گفته می‌شود) در دسترس قرار می‌دهد تا شما بتوانید به داده‌های ذخیره‌شده روی آن دسترسی پیدا کنید. به عبارت دیگر، با mount کردن یک دیسک، آن دیسک به بخشی از ساختار فایل سیستم لینوکس تبدیل می‌شود و شما می‌توانید با دستورات معمول سیستم‌عامل، به فایل‌ها و پوشه‌های آن دسترسی داشته باشید.


مفهوم unmount کردن به معنای قطع اتصال یک دستگاه ذخیره‌سازی (مانند دیسک سخت، پارتیشن یا درایو USB) از سیستم فایل لینوکس است. وقتی یک دیسک یا پارتیشن را unmount می‌کنید، سیستم عامل آن را از دایرکتوری خاصی (که به آن "mount point" گفته می‌شود) جدا می‌کند تا شما دیگر نتوانید به داده‌های ذخیره‌شده روی آن دسترسی پیدا کنید. به عبارت دیگر، با unmount کردن یک دیسک، آن دیسک از ساختار فایل سیستم لینوکس جدا می‌شود و شما نمی‌توانید با دستورات معمول سیستم‌عامل، به فایل‌ها و پوشه‌های آن دسترسی داشته باشید.

(based on [liara](https://docs.liara.ir/iaas/disks/mount/))

#### Paritions

Each partition on a disk has its own boundry. Suppose you have 200GB hard disk and you followed, say, this standard partioning approach: two partitions. partition one is 30 GB for root filesystem. The rest 170 GB for /home. Then if you fill up the whole partition 2 and you cannot save anything anymore on it (i.e. you cannot download any film from the internet). In such scenario, your OS will _not_ encounter \[almost\] any issues, since it has a different boundry (30 GB partition), and home partition cannot touch it. Your OS will continue running just fine (unless when it wants to save something on, say, Desktop). This is exactly why we use different partitions; we want different boundries. _(jay, btrfs video min 22)_


</br>

### Viewing Disk Info

List of storage disks on computer and for *each one* it will print its partitions:

```sh
sudo fdisk -l
```
Also taking a look at fstab file:

```sh
cat /etc/fstab
```
↳ You can see UUID of each partition is the first column. UUID **doesn't change** at all, even if you pull of your hard drive and put is in a different slot or different computer.

lists information about all available or the specified block devices:

```sh
lsblk
```
↳ Notes about the result: 
- if you see `loop*` names, they are created by each program that you install through `snap`. So, ignore them.

- under `MOUNTPOINTS` column, if you see **blank**, it means that disk (e.g. `sdc`) isn't mounted to the linux filesystem ([liara](https://docs.liara.ir/iaas/disks/mount/)). Now, what can we do? see _'Modifying Disk'_ section below.


if you want to also see filesystem info:

```sh
lsblk --fs
# or equivalently:
lsblk -o NAME,FSTYPE,FSVER,LABEL,UUID,FSAVAIL,FSUSE%,MOUNTPOINTS
```

You can see the UUID and partition label, by:

```sh
sudo blkid /dev/nvme0n1p2
```

</br>

## Modifying Disk

Assuming you have a disk, say, `sdc` that has recently attached. You need to partition and then _mount a filesystem located on that parition_ ^ so that it'll be accissible by OS.  

(^): btw, this is the more accurate term than saying ~~'mounting a partition'~~. ([here](https://www.linuxquestions.org/questions/linux-newbie-8/meaning-of-mounting-a-partition-4175647631))

- If you don't use LVM (Logical Volumes) to manage your disk, follow the traditional step. 
- If you use LVM then steps are different.

### Traditional (i.e. without LVM)

_(based on both 'Master Linux Admin' course and [liara](https://docs.liara.ir/iaas/disks/mount/) **third tab**)_

In order to partition a disk, use the following command:

```sh
sudo fdisk /dev/sdc
# type 'm' for help
# then, type 'n' for create new.
# ...
```

It will ask for size of partition, etc.  Eventually, after partition is created, you can verify it by running `lsblk` command. You should then see a `sdc1` partition (or something like that). Note, **the number at the end**. It indicates that this is a partition on device `sdc`. Likewise, on your local machine, you'll see `nvme0n1p1`, which means partition 1 (i.e. `p1`) on device `nvme0n1`.

Now, after you've partitioned it, you need to **format** it; i.e. you need to **tell OS which filesystem to use on this partition**. run:

```sh
sudo mkfs.ext4 /dev/sdc1
```

Now, you need to mount. You can mount whaever you like:

```sh
mount /dev/sdc1 /path/to/myDir
```

Then, you need to modify `fstab` as well, so that the OS **mounts automatically** after startup. Of course, as you can see we used `>>` which will append to the end of `fstab` file.

```sh
echo "/dev/sdc1 /path/to/myDir ext4 defaults 0 0" >> /etc/fstab
# first 0 means disable backup
# second 0 means disable checking at the boot time
```

Now, to verify, run the following. if it doesn't print anything, it means mounting was successful.  

```sh
mount -a
```
↳ `mount -a` (usually given in a bootscript) causes all filesystems mentioned in `fstab` to be mounted as indicated. (accodring to 'man mount')

BTW 1: just to reiterate, when providing `-a` flag to mount program we don't specify directory or partition, since it reads fstab file. On the other hand, the mount program _does not_ read the `/etc/fstab` file if both device (**or LABEL, UUID**, ID, PARTUUID or PARTLABEL) and `dir` are specified: e.g. `mount <partition> <dir>` (which we used before). 

BTW 2: as you saw, when we run `mount` program, we passed partition as a path to some file (e.g. `/dev/sdc1`). Recall, in linux *everything is a file*.

### Non-Traditional (LVM)

_see [liara](https://docs.liara.ir/iaas/disks/mount/) for quick instruction. But let's start from stratch ([source](https://www.webhi.com/how-to/how-to-use-lvm-to-manage-storage-on-linux-ubuntu-debian-redhat-centos/))._

The key advantage of LVM is the abstraction between physical disks and logical. You can resize, snapshot, and move logical volumes without having to modify the underlying physical devices. 

```
sudo apt install lvm2
```
The first step is to initialize disks or partitions as physical volumes (PVs) to be used by LVM. For example:

```sh
sudo pvcreate /dev/sdc1
```
You can verify available PVs:

```sh
sudo pvs
```

Next, you need to **combine one or more PVs into a volume group** (VG). The VG will be allocated space from the **pooled PVs**. (this is exactly the power of LVM).  
For example, to create a volume group called data using the /dev/sdb1 PV, run the following:

```sh
# 🔶 before running, see the line below:
sudo vgcreate dataVG /dev/sdb1
```

But, your cloud provider may have **alrealy created** some logical volumes for you. To see list of available VGs:

```sh
sudo vgs
```

List the details of a specific VG:

```sh
sudo vgdisplay dataVG
```

<span style="color: blue;"> Once you have a volume group, you can create logical volumes (LVs) within <strong>that</strong> VG </span>.  
For example, to create a 10GB logical volume called 'logs':

```sh
sudo lvcreate -L 10G -n logs dataVG
```

A useful version of the previous command to create an LV that uses all remaining free space in the VG:

```sh
sudo lvcreate -l 100%FREE -n apps dataVG 
```

Verify logical volumes:

```sh
sudo lvs

# to see the full path
sudo lvdisplay
```

Now, the **logical volumes will be mapped** to `/dev/VG/LV` devices that can be formatted and mounted, **just like regular partitions**.  
For example, to format the `logs` LV to ext4 and mount it at `/var/log`:

```sh
sudo mkfs.ext4 /dev/dataVG/logs 
sudo mkdir /var/log
sudo mount /dev/dataVG/logs /var/log

echo "/dev/dataVG/logs /var/log ext4 defaults 0 0" >> /etc/fstab
```

</br>

#### Extending or _Reducing_ a LV

Here comes the power of LVM. You can extend a local volume, i.e. as a result extend size of a directory in your filesystem without downtime.  

##### Example 1
For example, to grow the logs LV by 5GB, first extend the volume group by 5GB:

```sh
sudo lvextend -L +5G /dev/dataVG/logs
```

Then resize the filesystem to match:

```sh
sudo resize2fs /dev/dataVG/logs 
```

##### Example 2

Assuming another psychical hard drive `/dev/sdd1` partition exists, you can run:

```sh
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

</br>

### Creating Snapshots of LV 

#### Theory

LVM snapshots are your basic "copy on write" snapshot solution. The snapshot is really nothing more than asking the LVM to give you a "pointer" to the current state of the filesystem and to write changes made after the snapshot to a designated area. ([SO](https://serverfault.com/questions/41020/is-this-how-lvm-snapshots-work) and [redhat](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/6/html/logical_volume_manager_administration/snapshot_volumes))

LVM snapshots are meant to capture the filesystem in a frozen state. They are **not meant to be a backup in and of themselves**. They are, however, useful for obtaining backup images that are **consistent** because the frozen image cannot and will not change during the backup process. ([another](https://serverfault.com/questions/23965/lvm-snapshots-as-a-backup-strategy?rq=1))

There are a few steps to implement a snapshot. The first is that a **new** logical volume has to be allocated. The purpose of this volume is to provide an area where deltas (changes) to the filesystem are recorded. This allows the original volume to continue on without disrupting any existing read/write access. The downside to this is that the snapshot area is of a finite size, which means on a system with busy writes, it can fill up rather quickly. For volumes that have significant write activity, you will want to increase the size of your snapshot to allow enough space for all changes to be recorded.

When you access the original volume name, it will continue to refer to the live (read/write) version of the volume you did the snapshot of. The snapshot volume you create will refer to the frozen (read-only) version of the volume you intend to back up.

You are **still hosting data on the same physical drive** that can fail, and recovery of your filesystem from a drive that has failed is no backup at all. \[but you can transfer to another host, which then will become a real backup strategy\]. 

You people make it sound more complicated than it is. The snapshot stores the state of the source filesystem as it was when the snapshot was created. When the source fs changes, the snapshot doesn not change, allowing you to point **your backup program** (\[e.g. `rsync`\]) to read from the snapshot instead of ~~the source fs~~. Yes, a copy-on-write happens behind the screens, but the user doesn't notice this except for extra IO usage ([here](https://serverfault.com/a/23971))

LVM snapshots shouldn't be used by themselves as the final stage of your backup. But I've used them as an intermediary stage in conjunction with rsync to do filesystem level backups.

After you are done with backing up from the snapshot you would want to remove it to reduce any additional I/O overhead or other performance issues as others have mentioned using: (same)

```sh
lvremove /dev/<VG name>/<snapshot name>
```

see also **[Wyng](https://github.com/tasket/wyng-backup)**. and maybe [this](https://github.com/clemtibs/iserb/tree/master).  

#### Practice

##### Example 1

_(based on [here](https://devconnected.com/lvm-snapshots-backup-and-restore-on-linux/))_

As an example, let’s say that we want to backup the /etc folder of our server.

```sh
cp -R /etc /mnt/lv_mount
```
Now that our configuration folder is copied to our logical volume, let’s see how we can creating a LVM snapshot of this filesystem. Here `-s` means “snapshot”.

```sh
# syntax:  lvcreate -L <LV size> -s -n <snapshot name> /dev/<VG name>/<LV name>
lvcreate -L 10g -s -n snap_20250511 /dev/vg_1/lv_1
# it will create, say, lvol0

# verify:
lvdisplay <snapshot_name>
```

- Note 1: you can't create snapshot names having “snapshot” in the name as it is a reserved keyword.
- Note 2: You will also have to make sure that you have enough remaining space in the volume group as the snapshot will be created in **the same volume group** by default.

Now that your **snapshot** logical volume is created, you will have to mount it in order to perform a backup of the filesystem.

```sh
mount  /dev/vg_1/lvol0  /mnt/lv_snapshot
```

You can immediately verify that the mounting operating is effective by running `lsblk`. Now that your snapshot is mounted, you will be able to perform a backup of it using either the tar or the rsync commands.

```sh
tar -cvzf backup.tar.gz /mnt/lv_snapshot

rsync -aPh /mnt/lv_snapshot root@192.168.178.33:/backups
```

Now, to restore (based on [SO](https://serverfault.com/questions/906671/how-can-i-restore-an-lvm-snapshot-without-deleting-the-snapshot)):

```sh
lvconvert --merge /dev/hsotname-vg/snapshottorestore
```

Don't forget to reboot (if you're restoring the root volume).

NOTE: The <span style="color: red;"><strong>original snapshot will be deleted</strong></span> when the system is restored to the snapshot.

See also next example for restoring.


##### Example 2

(based on [here](https://www.claudiokuenzler.com/blog/482/restoring-reverting-lvm-snapshot-failback-rollback))

Before installing the packages or os upgrade:

```sh
lvcreate -L10g -s -n lxc12snapshot /dev/vgdata/lxc12
```

then install the packages. Let's assume it broke something. so let's restore the system (actually the affected directory) to the previous state.

Before the revert to the snapshot, the **LV needs to be unmounted**.

```sh
umount /var/lib/lxc/lxc12/rootfs
```

then the rollback can happen (the snapshot will be merged with the current LV):

```sh
lvconvert --merge /dev/vgdata/lxc12snapshot
```

Since, LVM snapshot works based on Copy-on-Write, so it should be fairly quickly.  
Now, (re)mount the LV:

```sh
mount /dev/mapper/vgdata-lxc12 /var/lib/lxc/lxc12/rootfs

```

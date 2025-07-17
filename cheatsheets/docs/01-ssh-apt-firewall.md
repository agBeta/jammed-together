# VPS (Hardening)

(_Most of the content is based on 'Nginx Perfect Server'._)

First make sure `~/.ssh` folder exists on your **home computer**.
```sh
cd ~

# creates .ssh folder if it does not exist.
mkdir .ssh 
```

## SSH (Part 1)

Now let's **login to the VPS** using root. You should find IP and root username & password of your VPS on dashboard of your Hosting provider.

```sh
ssh <user>@<ip>

ssh root@95.179.129.251
# will ask: Are you sure you want to continue connection?
# type 'yes'
# type the password.

# logout of the server
exit
```

**BTW 1**: If you see _'System restart required'_ or _'Pending kernel upgrade'_ on your first login; it is ok. As part of server creation process, the hosting provider usually runs an `apt update` command. Simply run `sudo reboot`. Give the server a little while to reboot & then login (ssh) again.

Now, the server's fingerprint should be stored in `~/.ssh/known_hosts` on your home computer.  

In case you want to **remove server's fingerprint** run below. Actually, the only time you need is when you've destroyed the server or you want to reinstall the server distribution.

```sh
ssh-keygen -R 95.179.129.251
```

</br>

## Non-root (Part 2)

Let's change the root user password.

```sh
passwd 
# type the password
 
```

Note: see also [changing password](#changing-password-of-a-user) below.

> <span style="color: brown;">**WARNING**</span>  
> If you lose the root password, there is NO WAY to recover that.

Now, let's add a non-root user.

```sh
adduser andrew 
# type the password for the user

cd /home

ls -lash
# 'andrew' directory should be listed.
```

By default, the Hosting provider may have some extra default users. (btw, How did we find out? result of `ls -lash` in home directory above).

If you don't need them, you can delete them:
```sh
deluser linuxuser123 --remove-home
```
The second parameter means **remove user's home directory** as well.

#### Changing password of a user
```sh
passwd andrew
```

#### Non-root User

Now, let's make the user non-root. First we need to ensure nano is **set as default editor**.

```sh
update-alternatives --config editor
```

Now:
```sh
visudo
# opens etc/sudoers.tmp
```

> <span style="color: brown;">**WARNING**</span>  
> Never open the sudoers via ~~`nano /etc/sudoers.tmp`~~. That may corrupt the file.

Now inside the file, find section _# User privilege specification_. Insert the following line below `root   ALL...`
```sh
andrew[tab] ALL=(ALL:ALL) ALL
```

The first `ALL` means the rule will apply to all hosts.  
The fourth `ALL` means there is **NO restriction** on which command andrew user can run with `sudo`.

Now save & exit.

BTW, _dreams of code "Setting up a production-ready VPS"_ uses `usermod` instead. There is no difference though (based on [this SO](https://unix.stackexchange.com/questions/476416/adding-a-user-to-sudo-group-vs-creating-a-sudoers-file)).

```sh
usermod -aG sudo andrew
```

</br>

#### Prevent root login

You need to edit `sshd_config` file. 

> <span style="color: dodgerblue;">**NOTE**</span>  
> Whenever you edit a configuration file, you need to restart the service associated with the config.

```sh
cd /etc
cd ssh
nano sshd_config
```

Note: There must be **no directive above the `Include ...` directive**. So if you see a line `PermitRootLogin yes`, you **MUST** first move it **below** the `Include ...` directive.

Now save & exit. This was the initial editing we had to make.  
Now, let's take a look at override files.

```sh
cd sshd_config.d
nano <filename>
```

If there is no file, simply create one: 50-cloud-init.conf.  
Any directives in this file, will **override** the sshd_config file.  
(are you sure? see [this SO](https://superuser.com/a/1142813) and [early include files](https://serverfault.com/a/1094096))

Add `PermitRootLogin no` at the **end** of override file. If the file has such directive with value `yes`, simply change the value to `no`.

Although you might have `PermitRootLogin yes` in your `sshd_config` **file**; that rule will be override by the override file.

Now let's restart ssh service:
```sh
systemctl restart ssh

exit
```

Let's re-login to check if new configuration is working.
```sh
ssh root@95.179.129.251
# should see: Permission denied.

# Now:
ssh andrew@95.179.129.251
# should be able to login as non-root user.
```

#### clear sudo password cache
```sh
sudo -k
```

### SSH change port

Note, since sshd now uses socket-based activation Ubuntu 22.10 or later, running `sudo systemctl restart sshd` after changing `sshd_config` is **NOT enough**.
However, first answer of [here](https://askubuntu.com/a/1439482) is ~~not needed~~; i.e. you _don't have to_ touch socket settings.. [The other answer](https://askubuntu.com/a/1534466) works fine for Ubuntu 24.04. Just run all of these in order:
```sh
sudo systemctl daemon-reload
sudo systemctl restart ssh.socket
sudo systemctl restart ssh.service
```

</br>

## SSH Key

### Why use ssh-key (instead of password authentication)?

using Keys is like having a long 2000 character password (well technically its even more strength) as compared to what you can key in manually in a terminal.  

Also, using ssh keys do have one unique feature compared to password login: you can specify the allowed commands. This can be done by modifying ~/.ssh/authorized_keys file at the server. ([here](https://serverfault.com/a/334483))

You can get the best of both worlds by allowing password authentication **only from within your network**. ([here](https://serverfault.com/a/334482))

### Generate ssh key pair

Generating key pairs is done locally on home computer.

```sh
# on your home computer (NOT the server)

cd ~
# [BTW, You may use ed25519. See ubuntu.md > "OpenSSH" section]
ssh-keygen -t rsa -b 4096 
# Enter file in which ... (type the following)
[...]   .ssh/server200_keys
# Enter passphrase (P.S.1)
```

P.S.1 (theoretical): Passphrase encrypt your private key. You will **only** be able to login to the server when you decrypt the private key using this passphrase.

Now, we need to copy the public key to the server:

```sh
# still on your home computer (NOT the server)

ssh-copy-id -i .ssh/server200_keys.pub andrew@95.179.129.251
# type the password of 'andrew' user (P.S.2)

# now ssh into server using the PRIVATE key:
ssh -i .ssh/server200_keys andrew@95.179.129.251
# type the passphrase
```

P.S.2: The password that you gave, when creating the user (or when changing via `passwd`); NOT ~~the ssh key-pair passphrase~~.

Now that we can login using ssh key, let's **turn off password authentication** (but why? see [this SO](https://serverfault.com/a/334483)).

```sh
cd /etc/ssh
cd sshd_config.d
sudo nano 50-cloud-init.conf
```

Add (or modify) the following rule: `PasswordAuthentication no` .
Don't forget to **restart the ssh service**.

Now let's check password authentication is disabled:
```sh
exit

ssh -o  PreferredAuthentication=password  -o PubkeyAuthentication=no andrew@95.179.129.251
```

> <span style="color: brown;">**WARNING**</span>  
> Now, if you lose your ssh key files, you will lose access to the server. so make sure to backup those files on a USB, etc.

</br>

## SSH Config File

Trying to remember ip addresses & usernames is not good. Instead we use config file with aliases. The config file is created **locally** on home computer.

```sh
cd ~
nano .ssh/config
```

\[BTW\]: Here, we modified ssh **client** config, not sshd **daemon**. see [this SO](https://serverfault.com/a/343534).

Now add the following lines. `Host` is the alias. `User` is the non-root user. `ServerAliveInterval` (and etc) will prevent getting disconnected after a short period of time.

```js
Host server200
Hostname 95.179.129.251
User andrew
IdentityFile ~/.ssh/server200_keys
ServerAliveInterval 60 
ServerAliveCountMax 120
```

Save & close.  
Now you can ssh into the server using: `ssh server200`

btw, You can add **another** server in the same `config` file. Simply add a blank line in between, then write those 6 variables for the new server.


</br>

## Packages

Note 1, `sudo apt update` does NOT install the packages; it just updates the list of available packages.

**Note 2**: When the upgrades are being installed by `apt` you might be prompted to override an existing configuration file. The best action is to type `no`. (otherwise you will lose all of your modifications).

in summary:

```sh
# ssh into the server, then:
sudo apt update
sudo apt upgrade

# to remove unnecessary packages:
sudo apt autoremove

# P.S.3
sudo reboot
```

P.S.3: The first time you do update & upgrade, it is highly recommended you reboot the server. Also when you upgrade to a new kernel, too.

> <span style="color: dodgerblue;">**NOTE**</span>  
> Run update, upgrade & autoremove at least three times a **week**.


</br>

## Firewall

First off, Cloud firewall works in conjugation with OS Firewall. Some hosting providers do _not_ have Cloud firewall feature.

`uwf` (uncomplicated firewall) default policy: deny all incoming, allow all outgoing.  
First check the status of uwf. Then we will add port 80 (http) and 443 (https tcp & udp).

```sh
sudo ufw status verbose 
# if prints 'inactive' it means ufw is disabled.

# --- (only if inactive) ---
# we need to define default policy
sudo ufw default deny incoming
sudo ufw default allow outgoing
# -------

sudo ufw allow http
sudo ufw allow https/tcp
sudo ufw allow https/udp

# --- (only if inactive) ---
sudo ufw enable
# -------

# we need to reload the service
sudo ufw reload
# (highly recommended)
sudo reboot


# after reboot, login again
ssh server200
# check ufw status
sudo ufw status verbose
```

In order to configure Cloud firewall, your hosting provider should have a section in its dashboard. It is recommended to restrict ssh to your IP address only.

</br>

## fail2ban

Note, 24.04.0 has an issue when installing `fail2ban` via apt. So you need to download `.deb` package from its github repo. Go to 'Releases' section. Copy the **url** for fail2ban_1.1.0-1.upstream1_all.deb. Head to your server.

```sh
wget -O fail2ban.deb <copied-url>

# verify it is downloaded
ls -lash

sudo dpkg -i fail2ban.deb

# install failed/missing dependencies that fail2ban relies on
sudo apt -f install

sudo systemctl status fail2ban
```

Note: if a **newer version of fail2ban** is released, you can update via `apt` (i.e. update, upgrade, autoremove).

### Configuration

The main configuration file is `jail.conf`. But, like ssh, we try not to modify this file directly. We make use of overwrite file (conventionally named `jail.local`).


```sh
cd /etc/fail2ban
# copy jail.conf
sudo cp jail.conf jail.local

# use 'sudo' because we are going to working with a configuration file
sudo nano jail.nano
```

Find `bantime` directive. The default is 10 minutes which is **far too short**. Specify seven days `7d`.  Change `findtime` to `3h` (three hours). Change `maxretry` to `3`.  
The current config means if you hit 3 failed attempts in 3 hours, on the 3rd attempt, your host (source ip) will be banned for 7 days.

Find `ignoreip` directive (probably commented out by default). If you have a **static** ip, append your ip at the **end**:
```sh
ignoreip = 127.0.0.1/8 ::1 12.13.14.15
                           ^^^^^^
```

Find `[sshd]`. Under this section, change `mode` from `normal` to `aggressive`. It will catch more attacks. Then **after** `backend ...`, add `enabled = true`.

Now restart fail2ban service. `sudo systemctl restart fail2ban`

fail2ban stores its logs in `/var/log/fail2ban.log` file.

### Unban

You may get locked out of your server. Most of the time rebooting your **router** will allocate a new ip to your home computer.  
If that did not work, first google 'what is my IP' and make a note of your home ip address. Then use web hosting 'Console' (or 'Terminal') access (somewhere in the dashboard).  
Login as the `root` user. Enter password.
```sh
cd /var/log

cat fail2ban.log
# you should see your ip address in the log file.

fail2ban-client set sshd unbanip <your-ip>

cat fail2ban.log
# make sure unban log is there
```

If you want to see the status & list of banned ip addresses for ssh:
```sh
sudo fail2ban-client status sshd
```

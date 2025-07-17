# Ansible (2025)


## Installation

First on the **control** node (NOT ~~managed nodes~~) we create `ansible` user. Actually creating ansible user on the control node isn't mandatory but very recommended. 

```sh
sudo useradd ansible
# any name is ok; 'ansible' is more convenient

sudo passwd ansible 
# ... (enter new password in the prompt)

# make 'ansible' user a member of wheel group
sudo usermod -aG wheel ansible
```

Anyway, make sure this user has sudo privileges on at least the managed nodes. For this, we need to change sudoers file:

```sh
sudo visudo
```

Do **NOT** use `NOPASSWD` in production. We use it just to get started for demo quickly. 
(btw, For production use `Default timestamp_type=global,timestamp_timeout=...`)  

```sh
# ...
%wheel  ALL=(ALL)     NOPASSWD: ALL

# ... (rest of sudoers file) ...
```

Now become the user `ansible`.

```sh
su - ansible
# you may want to logout/login instead.
```

### Connecting to Managed Hosts

First let's check a managed host is reachable:

```sh
# managed host 1:
ping 192.168.29.205
# managed host 2:
ping 192.168.29.206

sudo nano /etc/hosts
```

Now at the end of hosts file add these two lines:

```sh
...
192.168.29.205  ansible1.example.local ansible1
#               ^^ long name ^^        ^^ short name 
192.168.29.206  ansible2.example.local ansible2
```

So far we haven't done anything related to ansible yet.

We're in control node and `ansible-core` package must be installed. You can either install via the distribution package managers or via `pip3`. This first approach is recommended.

```sh
sudo apt install ansible-core
```

Now, we must be able to ssh into managed nodes from our control node:

```sh
ssh ansible1
# the first time ssh doesn't know the identity of the remote (managed) host. So it will ask you.
# press 'y'; because we're sure we want to connect to the remote host.

# will ask for password
# ... but we don't have a user 'ansible' in our remote host yet!
# just ctrl+C

# try again for ansible2
ssh ansible
# press y
# ctrl+C
```

**But why?!** the important thing here is we're caching the response to the first time confront of ansible with a managed node. Because if we don't do this 'yes' manually now, ansible will refuse to continue later. There is NOT easy way around this in ansible setup.

Alternatively, you could do `ssh user1@ansible1` assuming the user1 exists on ansible1 machine. But the previous approach is fine.

(a few sections later we'll utilize about `ssh-keygen`.)

<br>

Two more things to do:

- Nowadays, python usually comes as native part of most linux distros. But you may want to verify.  
- Firewall

Create file `inventory`:

```sh
ansible1
ansible2
```

Now, we use `ansible` so-called ad-hoc command that will push the new config to the remote hosts. 
- `all` means we want to perform this on all of managed nodes (declared in `inventory` file). If you want to run only on, say, first node, you can write `ansible1` instead.
- `-u` is the user. 
`-k` will prompt for ssh password. `-K` will prompt for 'become' password.
- `-m` tells that we're going to run a module, and the module is [`command` module]() from ansible-core (that is installed by default; so there is no need to go for ansible collections from galaxy.ansible.com).  

'command' module is the universal way to run linux commands on managed nodes.

```sh
ansible -i inventory all -u root -k -K -m command -a "useradd ansible"
# Any user with sudo privileges in managed nodes (instead of 'root') will also work.
# But then you MUST also append `-b` flag before `-K` to 'become'.
```

The previous should create `ansible` user on both nodes.

```sh
ansible -i inventory all -u root -k -K -m shell -a "echo password | passwd --stdin ansible"
```

Above we used [`shell` module]()  instead of 'command'. Because, shell-specific things like pipe `|` do not work in 'command' module.  Note, it will **prompt** you for ssh password. simply hit Enter.

After command above runs successfully, we should have user 'ansible' with password 'password' on both managed nodes.

Now let's verify if it actually worked and user `ansible` is created on, say, the second managed node:

```sh
ssh ansible@ansible2
# enter 'password' for password prompt.
```

It should successfully work. But as you can notice from ssh logs, a home directory is created for `ansible` user. We don't want that. So let's fix it. First, we remove the user via [`user` module]():

```sh
ansible -i inventory ansible2 -u root -k -K -m user -a "name=ansible state=absent"
```

Now, let's create the user again. This time notice the `-m` flag after `command`. This tells that we don't need a home directory for the user we are about to create:

```sh
ansible -i inventory all -u root -k -K -m command -a "useradd -m ansible"
```

_(video 2.9)_

Now let's verify `ansible` user can actually run ansible:

```sh
ansible -i inventory all -u ansible -k -K -m command -a "whoami"
# both should print ansible ^^^^^^

# BUT the next command will fail, since user 'ansible' doesn't have enough permissions:
ansible -i inventory all -u ansible -k -K -m command -a "ls -l /root"
```

To do so, first add the control node to list of host and `inventory`:

```sh
# etc/hosts
(...)
192.168.29.200 control

# inventory
(...)
control
```

Here we escalate privileges of user `ansible` in all nodes (control, ansible1, ansible2). For this we utilize [`copy` module]() and an _override file_:

```sh
ansible -i inventory all -u root -k -b -K -m copy -a 'content="ansible ALL=(ALL) NOPASSWD: ALL" dest=/etc/sudoers.d/ansible'
```

Oh, you encounter an error. Because we haven't accepted connecting to `control` host. So first we had to:

```sh
ssh control
# press y
```

Now, after privilege escalation we're ready to test user `ansible` again; i.e. whether it can run ansible. **NOTE**, we also include `-b` this time to 'become'.

```sh
ansible -i inventory all -u ansible -b -k -K -m command -a "ls -l /root"
```

So far we've been typing ssh password every time. We can fix this using `ssh-keygen`. Note, we're the user `ansible` on the control node.

```sh
ssh-keygen
# press enter multiple times

ssh-copy-id control
# this may seem odd that we copy to control and we're on control.

ssh-copy-id ansible1
ssh-copy-id ansible2
```

So in order to verify, we drop `-K` from the command. Actually we can remove other flags too:

```sh
ansible -i inventory all -b -m command -a "ls -l /root"
```

</br>

## Config file

Having `ansible.cfg` is not mandatory. But it will help us reduce typing repetitive flags, etc. Configuration file will be searched for in the following order:

- ANSIBLE_CONFIG (environment variable if set)
- ansible.cfg (in the **current** directory)
- ~/.ansible.cfg (in the home directory)
- /etc/ansible/ansible.cfg

_(based on [docs](https://docs.ansible.com/ansible/latest/reference_appendices/config.html#the-configuration-file))_

**NOTE**: config files do **NOT** merge. If, say, ansible.cfg exists in the project directory, then /etc/ansible/ansible.cfg will be **ignored**.

```sh
ansible --version
# tells which ansible.cfg is used.
```

A typical ansible.cfg file:

```ini
[defaults]
remote_user = ansible
# we've just created user `ansible`
host_key_checking = false
inventory = inventory
# the file 'inventory' in the current directory is used as inventory

[privilege_escalation]
become = True
# see P.S.1
become_method = sudo
become_user = root
become_ask_pass = false
# we're not prompted for password anymore
```

(P.S. 1): some people say it is not good to become `root` user all the time because some playbooks don't require such privilege. But in my experience, ansible is used for config management, and most of the time you need root privilege to mess with config files. So `become = True` is completely fine.

Now that we have a config file, we can write commands in a shorter way. 

```sh
ansible -all -a "ls -l /root"
```

Note, we also dropped `-m command`, because 'command' module is the default module.

see also video 15.

</br>


## Ad-hoc Commands

```sh
ansible-doc -l
# get list of all modules
```

To install additional modules as **content collections** from galaxy.ansible.com.  
Below we'll example of using some ad-hoc commands.

Make sure you are `ansible` user on control node and on a directory that has `inventory` file and `ansible.cfg`.

```sh
ansible ubuntu -i inventory -u student -b -K -m package -a "name=nmap"

ansible all -m ping

ansible all -m user -a "name=lisa"
# now checking if user lisa is created on all nodes
ansible all -m command -a "id lisa"

# copy /etc/hosts from control node to managed nodes.
ansible all -m copy -a "src=/etc/hosts dest=/etc/hosts"
```

</br>

### Ansible Content Collections

It is recommended to use FQCN (i.e. `ansible.builtin.copy`) instead of short names.  

```sh
ansible-galaxy collection install ansible.windows
ansible-galaxy collection list

ansible-doc -l | grep "setup"

ansible-doc file
# gives info about 'file' module
```

### Back to Modules

```sh
ansible all -m service -a "name=httpd state=started enabled=yes"
```

Idempotent way vs non-idempotent way:

```sh
ansible ansible1 -m command -a "useradd json"

# idempotent way (idempotency)
ansible ansible1 -m user -a "name=json"
```

Removing a file:

```sh
ansible all -m file -a "name=/tmp/hosts state=absent"
```

</br>

## Variables

Make sure you are in your project directory.

file `inventory`:

```sh
[redhat] # this is called a host group
ansible1

[ubuntu]
ansible2
```

Create `group_vars` directory. Then inside it create file `redhat` and file `ubuntu`.

```sh
# file redhat
myuser: anna

# file ubuntu
myuser: lisa
```

In your playbook you don't need `vars_files` anymore. Because `host_vars` and `group_vars` are automatically picked by ansible.

```yml
---
- name: demo variables
  gather_facts: no
  # NO NEED for vars_files
  hosts: all
  tasks:
    - name: creating user {{ myuser }}
      user:
         name: "{{ myuser }}"
         shell: /bin/bash
         # ... other options for 'user' module ...
```

<br />

## Facts

```sh
ansible ansible1 -m setup | less
```



